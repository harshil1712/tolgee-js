import type { Options } from './StateService/initState';

export type { State, Options } from './StateService/initState';
export type { EventEmitterType } from './EventService/EventEmitter';
export type { EventEmitterSelectiveType } from './EventService/EventEmitterSelective';

export type FallbackGeneral = undefined | false | string | string[];

export type FallbackNS = FallbackGeneral;

export type FallbackNSTranslation = undefined | string | string[];

export type FallbackLanguage = FallbackGeneral;

export type FallbackLanguageObject = Record<string, FallbackLanguage>;

export type FallbackLanguageOption = FallbackLanguage | FallbackLanguageObject;

export type TranslateProps = {
  key: string;
  params?: TranslationParams;
  defaultValue?: string;
  ns?: FallbackNSTranslation;
  noWrap?: boolean;
  orEmpty?: boolean;
  fallbackLanguages?: FallbackLanguage;
};

export type TranslatePropsInternal = TranslateProps & {
  translation?: string;
};

export type TranslationValue = string | undefined | null;

export type TranslationsFlat = Map<string, TranslationValue>;

export type TreeTranslationsData = {
  [key: string]: TranslationValue | TreeTranslationsData;
};

export type CacheAsyncRequests = Map<
  string,
  Promise<TreeTranslationsData> | undefined
>;

export type CacheDescriptor = {
  language: string;
  namespace?: string;
};

export type CacheKeyObject = {
  language: string;
  namespace: string;
};

export type KeyAndParams = {
  key: string;
  params?: TranslationParams;
  defaultValue?: string;
  ns?: FallbackNSTranslation;
};

export type Unwrapped = { text: string; keys: KeyAndParams[] };

export type TranslationParams = {
  [key: string]: string | number | bigint;
};

export type WrapperWrapFunction = (props: TranslatePropsInternal) => string;
export type WrapperUnwrapFunction = (text: string) => Unwrapped;

export type WrapperAttributeXPathGetter = (props: {
  tag: string;
  attribute: string;
}) => string;

export type WrapperInterface = {
  unwrap: WrapperUnwrapFunction;
  wrap: WrapperWrapFunction;
  getTextXPath: () => string;
  getAttributeXPath: WrapperAttributeXPathGetter;
};

export type FormatterPluginFormatParams = {
  translation: string;
  language: string;
  params: Record<string, any> | undefined;
};

export type FormatterPlugin = {
  format: (props: FormatterPluginFormatParams) => string;
};

export type ObserverProps = {
  translate: (params: TranslatePropsInternal) => string;
  onClick: TranslationOnClick;
};

export type ObserverPlugin = (props: ObserverProps) => {
  unwrap: (text: string) => Unwrapped;
  wrap: (props: TranslatePropsInternal) => string;
  retranslate: () => void;
  stop: () => void;
};

export type BackendDevProps = {
  apiUrl?: string;
  apiKey?: string;
};

export type BackendGetRecordProps = {
  language: string;
  namespace?: string;
};

export type BackendGetRecord = (
  data: BackendGetRecordProps
) => Promise<TreeTranslationsData> | undefined;

export type BackendPlugin = {
  getRecord: BackendGetRecord;
};

export type BackendGetDevRecord = (
  data: BackendGetRecordProps & BackendDevProps
) => Promise<TreeTranslationsData> | undefined;

export type BackendDevPlugin = {
  getRecord: BackendGetDevRecord;
};

export type TolgeeEvent =
  | 'pendingLanguage'
  | 'language'
  | 'key'
  | 'fetching'
  | 'initialLoad'
  | 'keyUpdate';

export type TolgeeOn = {
  (event: 'pendingLanguage', handler: ListenerHandler<string>): Listener;
  (event: 'language', handler: ListenerHandler<string>): Listener;
  (event: 'key', handler: ListenerHandler<string>): Listener;
  (event: 'fetching', handler: ListenerHandler<boolean>): Listener;
  (event: 'initialLoad', handler: ListenerHandler<void>): Listener;
  (event: 'keyUpdate', handler: ListenerHandler<void>): ListenerSelective;
  (event: TolgeeEvent, handler: ListenerHandler<any>):
    | Listener
    | ListenerSelective;
};

export type TolgeeInstance = Readonly<{
  on: TolgeeOn;

  setFormatter: (
    formatter: FormatterPlugin | undefined
  ) => Readonly<TolgeeInstance>;
  setObserver: (
    observer: ObserverPlugin | undefined
  ) => Readonly<TolgeeInstance>;
  setUi: (ui: UiLibInterface | undefined) => Readonly<TolgeeInstance>;
  addBackend: (backend: BackendPlugin | undefined) => Readonly<TolgeeInstance>;
  setDevBackend: (
    backend: BackendPlugin | undefined
  ) => Readonly<TolgeeInstance>;

  getLanguage: () => string;
  getPendingLanguage: () => string;
  changeLanguage: (language: string) => Promise<void>;
  changeTranslation: (
    descriptor: CacheDescriptor,
    key: string,
    value: string
  ) => void;
  addActiveNs: (namespace: string) => Promise<void>;
  removeActiveNs: (ns: string) => void;
  loadRecord: (
    descriptor: CacheDescriptor
  ) => Promise<TreeTranslationsData | TranslationsFlat | undefined>;
  isLoading: () => boolean;
  isFetching: () => boolean;
  init: (options: Partial<Options>) => Readonly<TolgeeInstance>;
  run: () => Promise<void>;
  stop: () => void;
  t: (props: TranslatePropsInternal) => string;
}>;

export type NodeLock = {
  locked?: boolean;
};

export type NodeMeta = {
  oldTextContent: string;
  keys: KeyAndParams[];
};

export type ElementMeta = {
  wrappedWithElementOnlyKey?: string;
  wrappedWithElementOnlyDefaultHtml?: string;
  nodes: Map<Node, NodeMeta>;
  highlightEl?: HTMLDivElement;
  highlight?: () => void;
  unhighlight?: () => void;
  /**
   * Stops removing of element's inactive nodes and
   * unregistering from ElementRegistrar.
   *
   * It's used when user has mouse on the element, so there is
   * potential, that element highlight will be triggered.
   *
   * Triggering highlight needs the metadata stored on element, so
   * we need the ability to prevent clean.
   */
  preventClean?: boolean;
};

export type TolgeeElement = Element &
  ElementCSSInlineStyle & {
    _tolgee?: boolean;
  };

export type ObserverOptions = {
  tagAttributes: Record<string, string[]>;
  highlightKeys: ModifierKey[];
  highlightColor: string;
  highlightWidth: number;
  targetElement?: HTMLElement;
  inputPrefix: string;
  inputSuffix: string;
  passToParent: (keyof HTMLElementTagNameMap)[] | ((node: Element) => boolean);
};

export type ObserverOptionsInitial = Partial<ObserverOptions>;

export type RegistredElementsMap = Map<TolgeeElement, ElementMeta>;

export enum ModifierKey {
  Alt,
  Control,
  Shift,
  Meta,
}

export type UiProps = {
  getTranslation(key: string): string;
};

export type UiInstance = {
  handleElementClick(
    event: MouseEvent,
    keysAndDefaults: KeyWithDefault[]
  ): Promise<void>;
};

export type UiConstructor = new (props: UiProps) => UiInstance;

export type UiLibInterface = {
  UI: UiConstructor;
};

export type UiType = UiConstructor | UiLibInterface;

export type KeyWithDefault = { key: string; defaultValue?: string };

export type TranslationOnClick = (
  event: MouseEvent,
  data: {
    keysAndDefaults: KeyWithDefault[];
    el: TolgeeElement;
    meta: ElementMeta;
  }
) => void;

export type Listener = {
  unsubscribe: () => void;
};

export type ListenerSelective = {
  unsubscribe: () => void;
  subscribeToKey: (key: string) => ListenerSelective;
  unsubscribeKey: (key: string) => ListenerSelective;
};

export type ListenerHandler<T> = (data: T) => void;
