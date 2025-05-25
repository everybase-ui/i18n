import { createContext, Suspense, use, useContext, useState } from 'react';

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
    if (!locale) throw 'LocaleContext not found';
    return locale;
  }

  const cache: Partial<Record<Locale, Translations>> = {};

  type ProviderProps = React.PropsWithChildren<{
    defaultLocale: Locale;
    fallback?: React.ReactNode;
  }>;
  function Provider({ defaultLocale, fallback, children }: ProviderProps) {
    const locale = useState(defaultLocale);
    return (
      <LocaleContext value={locale}>
        <TranslationsLoader fallback={fallback}>{children}</TranslationsLoader>
      </LocaleContext>
    );
  }

  function TranslationsLoader({
    fallback,
    children,
  }: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
    const [locale] = useLocale();
    const translations = resources[locale];

    if (cache[locale]) return children;

    if (typeof translations === 'function') {
      return (
        <Suspense fallback={fallback}>
          <LazyTranslations translations={translations()}>
            {children}
          </LazyTranslations>
        </Suspense>
      );
    }

    cache[locale] = translations as Translations;

    return children;
  }

  function LazyTranslations({
    translations,
    children,
  }: React.PropsWithChildren<{ translations: Promise<Translations> }>) {
    const [locale] = useLocale();
    cache[locale] = use(translations);
    return children;
  }

  type TArgs<Id extends TranslationId> = TranslationParamKey<Id> extends never
    ? [Id]
    : [Id, TranslationParams<Id>];
  function useT() {
    const [locale] = useLocale();

    function t<Id extends TranslationId>(...args: TArgs<Id>) {
      const [id, params] = args;
      const translation: string = (cache[locale] as Translations)[id];

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
