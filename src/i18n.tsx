import {
  createContext,
  Suspense,
  use,
  useContext,
  useMemo,
  useState,
} from 'react';

const LocaleContextNotFoundError = new Error('LocaleContext not found');

type ParamKey<T extends string> = T extends `${string}{${infer P}}${infer R}`
  ? P | ParamKey<R>
  : never;

export function createI18n<
  Locale extends string,
  Translations extends Record<string, string>,
>(resources: Record<Locale, Translations | (() => Promise<Translations>)>) {
  type TranslationId = keyof Translations;
  type TranslationParamKey<Id extends TranslationId> = ParamKey<
    Translations[Id]
  >;
  type TranslationParams<Id extends TranslationId> = Record<
    TranslationParamKey<Id>,
    string
  >;

  type LocaleContext = [Locale, React.Dispatch<React.SetStateAction<Locale>>];
  const LocaleContext = createContext<LocaleContext | undefined>(undefined);

  function useLocale() {
    const locale = useContext(LocaleContext);
    if (!locale) throw LocaleContextNotFoundError;
    return locale;
  }

  const TranslationsContext = createContext<Translations | undefined>(
    undefined,
  );

  function useTranslations() {
    const translations = useContext(TranslationsContext);
    if (!translations) throw LocaleContextNotFoundError;
    return translations;
  }

  type ProviderProps = React.PropsWithChildren<{
    defaultLocale: Locale;
    fallback?: React.ReactNode;
  }>;
  function Provider({ defaultLocale, fallback, children }: ProviderProps) {
    const localeContext = useState(defaultLocale);
    const [locale] = localeContext;

    const translations = useMemo(() => {
      const translations: Translations | (() => Promise<Translations>) =
        resources[locale];
      return typeof translations === 'function' ? translations() : translations;
    }, [resources, locale]);

    return (
      <LocaleContext value={localeContext}>
        {translations instanceof Promise ? (
          <Suspense fallback={fallback}>
            <AsyncTranslationsProvider translationsPromise={translations}>
              {children}
            </AsyncTranslationsProvider>
          </Suspense>
        ) : (
          <TranslationsContext value={translations}>
            {children}
          </TranslationsContext>
        )}
      </LocaleContext>
    );
  }

  function AsyncTranslationsProvider({
    translationsPromise,
    children,
  }: React.PropsWithChildren<{ translationsPromise: Promise<Translations> }>) {
    const translations = use(translationsPromise);

    return (
      <TranslationsContext value={translations}>{children}</TranslationsContext>
    );
  }

  type TArgs<Id extends TranslationId> = TranslationParamKey<Id> extends never
    ? [Id]
    : [Id, TranslationParams<Id>];
  function useT() {
    const translations = useTranslations();

    function t<Id extends TranslationId>(...args: TArgs<Id>) {
      const [id, params] = args;
      const translation = translations[id];
      if (!params) return translation;

      return translation.replaceAll(/{.+?}/g, (match) => {
        const key = match.slice(1, -1) as TranslationParamKey<Id>;
        return params[key];
      });
    }

    return t;
  }

  type TProps<Id extends TranslationId> = TranslationParamKey<Id> extends never
    ? { id: Id }
    : {
        id: Id;
        params: TranslationParams<Id>;
      };
  function T<Id extends TranslationId>(props: TProps<Id>) {
    const t = useT();
    const args = [
      props.id,
      ...('params' in props ? [props.params] : []),
    ] as TArgs<Id>;
    return t(...args);
  }

  return {
    useLocale,
    useT,
    Provider,
    T,
  };
}
