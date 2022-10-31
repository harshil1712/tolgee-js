import { EventEmitter } from './EventEmitter';
import { EventEmitterSelective } from './EventEmitterSelective';
import {
  CacheDescriptorWithKey,
  KeyDescriptorInternal,
  ListenerHandler,
} from '../../types';
import { TolgeeOn } from '../../types/event';

export const Events = (
  getFallbackNs: () => string[],
  getDefaultNs: () => string
) => {
  const onPendingLanguageChange = EventEmitter<string>();
  const onLanguageChange = EventEmitter<string>();
  const onKeyChange = EventEmitter<KeyDescriptorInternal>();
  const onLoadingChange = EventEmitter<boolean>();
  const onFetchingChange = EventEmitter<boolean>();
  const onInitialLoaded = EventEmitter<void>();
  const onKeyUpdate = EventEmitterSelective(getFallbackNs, getDefaultNs);
  const onCacheChange = EventEmitter<CacheDescriptorWithKey>();
  const onRunningChange = EventEmitter<boolean>();

  onInitialLoaded.listen(() => onKeyUpdate.emit());
  onLanguageChange.listen(() => onKeyUpdate.emit());
  onCacheChange.listen(({ value }) => {
    onKeyUpdate.emit({ ns: [value.namespace], key: value.key }, true);
  });

  const on: TolgeeOn = (event, handler): any => {
    switch (event) {
      case 'pendingLanguage':
        return onPendingLanguageChange.listen(handler as any);
      case 'language':
        return onLanguageChange.listen(handler as any);
      case 'loading':
        return onLoadingChange.listen(handler as any);
      case 'fetching':
        return onFetchingChange.listen(handler as any);
      case 'initialLoad':
        return onInitialLoaded.listen(handler as any);
      case 'running':
        return onRunningChange.listen(handler as any);
      case 'cache':
        return onCacheChange.listen(handler as any);
      case 'keyUpdate':
        return onKeyUpdate.listen(handler as any);
    }
  };

  return Object.freeze({
    onPendingLanguageChange,
    onLanguageChange,
    onKeyChange,
    onKeyUpdate,
    onLoadingChange,
    onFetchingChange,
    onInitialLoaded,
    onRunningChange,
    onCacheChange,
    on,
  });
};

export type EventServiceType = ReturnType<typeof Events>;
