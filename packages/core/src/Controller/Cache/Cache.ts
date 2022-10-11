import {
  CacheAsyncRequests,
  CacheDescriptor,
  CacheDescriptorInternal,
  CacheDescriptorWithKey,
  EventEmitterInstance,
  FallbackNSTranslation,
  Options,
  TranslationsFlat,
  TranslationValue,
  TreeTranslationsData,
  BackendGetRecord,
  BackendGetDevRecord,
} from '../../types';
import { getFallbackArray } from '../State/helpers';
import { ValueObserverInstance } from '../ValueObserver';

import { decodeCacheKey, encodeCacheKey, flattenTranslations } from './helpers';

type CacheRecord = {
  version: number;
  data: TranslationsFlat;
};

type StateCache = Map<string, CacheRecord>;

export const Cache = (
  onCacheChange: EventEmitterInstance<CacheDescriptorWithKey>,
  backendGetRecord: BackendGetRecord,
  backendGetDevRecord: BackendGetDevRecord,
  withDefaultNs: (descriptor: CacheDescriptor) => CacheDescriptorInternal,
  isInitialLoading: () => boolean,
  fetchingObserver: ValueObserverInstance<boolean>,
  loadingObserver: ValueObserverInstance<boolean>
) => {
  const asyncRequests: CacheAsyncRequests = new Map();
  const cache: StateCache = new Map();
  let staticData: NonNullable<Options['staticData']> = {};
  let version = 0;

  function addStaticData(data: Options['staticData']) {
    if (data) {
      staticData = { ...staticData, ...data };
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value !== 'function') {
          const descriptor = decodeCacheKey(key);
          const existing = cache.get(key);
          if (!existing || existing.version === 0) {
            addRecordInternal(descriptor, value, 0);
          }
        }
      });
    }
  }

  function invalidate() {
    asyncRequests.clear();
    version += 1;
  }

  function addRecordInternal(
    descriptor: CacheDescriptorInternal,
    data: TreeTranslationsData,
    recordVersion: number
  ) {
    const cacheKey = encodeCacheKey(descriptor);
    cache.set(cacheKey, {
      data: flattenTranslations(data),
      version: recordVersion,
    });
    onCacheChange.emit(descriptor);
  }

  function addRecord(
    descriptor: CacheDescriptorInternal,
    data: TreeTranslationsData
  ) {
    addRecordInternal(descriptor, data, version);
  }

  function exists(descriptor: CacheDescriptorInternal, strict = false) {
    const record = cache.get(encodeCacheKey(descriptor));
    if (record && strict) {
      return record.version === version;
    }
    return Boolean(record);
  }

  function getRecord(descriptor: CacheDescriptor) {
    return cache.get(encodeCacheKey(withDefaultNs(descriptor)))?.data;
  }

  function getTranslation(descriptor: CacheDescriptorInternal, key: string) {
    return cache.get(encodeCacheKey(descriptor))?.data.get(key);
  }

  function getTranslationNs(
    namespaces: string[],
    languages: string[],
    key: string
  ) {
    for (const namespace of namespaces) {
      for (const language of languages) {
        const value = cache
          .get(encodeCacheKey({ language, namespace }))
          ?.data.get(key);
        if (value !== undefined && value !== null) {
          return namespace;
        }
      }
    }
    return Array.from(new Set(namespaces));
  }

  function getTranslationFallback(
    namespaces: string[],
    languages: string[],
    key: string
  ) {
    for (const namespace of namespaces) {
      for (const language of languages) {
        const value = cache
          .get(encodeCacheKey({ language, namespace }))
          ?.data.get(key);
        if (value !== undefined && value !== null) {
          return value;
        }
      }
    }
    return undefined;
  }

  function changeTranslation(
    descriptor: CacheDescriptorInternal,
    key: string,
    value: TranslationValue
  ) {
    const record = cache.get(encodeCacheKey(descriptor))?.data;
    record?.set(key, value);
    onCacheChange.emit({ ...descriptor, key });
  }

  function isFetching(ns?: FallbackNSTranslation) {
    if (isInitialLoading()) {
      return true;
    }

    if (ns === undefined) {
      return asyncRequests.size > 0;
    }
    const namespaces = getFallbackArray(ns);
    return Boolean(
      Array.from(asyncRequests.keys()).find((key) =>
        namespaces.includes(decodeCacheKey(key).namespace)
      )
    );
  }

  function isLoading(language: string | undefined, ns?: FallbackNSTranslation) {
    const namespaces = getFallbackArray(ns);

    return Boolean(
      isInitialLoading() ||
        Array.from(asyncRequests.keys()).find((key) => {
          const descriptor = decodeCacheKey(key);
          return (
            (!namespaces.length || namespaces.includes(descriptor.namespace)) &&
            !exists({
              namespace: descriptor.namespace,
              language: language!,
            })
          );
        })
    );
  }

  function fetchNormal(keyObject: CacheDescriptorInternal) {
    let dataPromise = undefined as
      | Promise<TreeTranslationsData | undefined>
      | undefined;
    if (!dataPromise) {
      const staticDataValue = staticData[encodeCacheKey(keyObject)];
      if (typeof staticDataValue === 'function') {
        dataPromise = staticDataValue();
      } else if (staticDataValue) {
        dataPromise = Promise.resolve(staticDataValue);
      }
    }

    if (!dataPromise) {
      dataPromise = backendGetRecord(keyObject);
    }

    if (!dataPromise) {
      // return current data or empty object
      dataPromise = Promise.resolve({});
    }

    return dataPromise;
  }

  function fetchData(keyObject: CacheDescriptorInternal, isDev: boolean) {
    let dataPromise = undefined as
      | Promise<TreeTranslationsData | undefined>
      | undefined;
    if (isDev) {
      dataPromise = backendGetDevRecord(keyObject)?.catch(() => {
        // eslint-disable-next-line no-console
        console.warn(`Tolgee: Failed to fetch data from dev backend`);
        // fallback to normal fetch if dev fails
        return fetchNormal(keyObject);
      });
    }

    if (!dataPromise) {
      dataPromise = fetchNormal(keyObject);
    }

    return dataPromise;
  }

  async function loadRecords(descriptors: CacheDescriptor[], isDev: boolean) {
    const withPromises = descriptors.map((descriptor) => {
      const keyObject = withDefaultNs(descriptor);
      const cacheKey = encodeCacheKey(keyObject);
      const existingPromise = asyncRequests.get(cacheKey);

      if (existingPromise) {
        return {
          new: false,
          promise: existingPromise,
          keyObject,
          cacheKey,
        };
      }
      const dataPromise = fetchData(keyObject, isDev);
      asyncRequests.set(cacheKey, dataPromise);
      return {
        new: true,
        promise: dataPromise,
        keyObject,
        cacheKey,
      };
    });
    fetchingObserver.notify();
    loadingObserver.notify();

    const results = await Promise.all(withPromises.map((val) => val.promise));

    withPromises.forEach((value, i) => {
      const promiseChanged =
        asyncRequests.get(value.cacheKey) !== value.promise;
      // if promise has changed in between, it means cache been invalidated or
      // new data are being fetched
      if (value.new && !promiseChanged) {
        asyncRequests.delete(value.cacheKey);
        const data = results[i];
        if (data) {
          addRecord(value.keyObject, data);
        }
      }
    });
    fetchingObserver.notify();
    loadingObserver.notify();

    return withPromises.map((val) => getRecord(val.keyObject)!);
  }

  function getAllRecords() {
    const entries = Array.from(cache.entries());
    return entries.map(([key, entry]) => {
      return {
        ...decodeCacheKey(key),
        data: entry.data,
      };
    });
  }

  return Object.freeze({
    addStaticData,
    invalidate,
    addRecord,
    exists,
    getRecord,
    getTranslation,
    getTranslationNs,
    getTranslationFallback,
    changeTranslation,
    isFetching,
    isLoading,
    loadRecords,
    getAllRecords,
  });
};

export type CacheType = ReturnType<typeof Cache>;
