import { createContext, useContext, useState } from 'react';

type ParamKey<T extends string> = T extends `${string}{${infer P1}}${infer T1}`
  ? P1 | ParamKey<T1>
  : never;

export type I18nResources = Record<string, Record<string, string>>;

export function createI18n<Resources extends I18nResources>(
  resources: Resources,
) {
  type Locale = keyof Resources;
  type TranslationId = keyof Resources[Locale];
  type TranslationParamKey<Id extends TranslationId> = ParamKey<
    Resources[Locale][Id]
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

  type ProviderProps = React.PropsWithChildren<{
    defaultLocale: Locale;
  }>;
  function Provider({ defaultLocale, children }: ProviderProps) {
    const locale = useState(defaultLocale);
    return <LocaleContext value={locale}>{children}</LocaleContext>;
  }

  type TArgs<Id extends TranslationId> = TranslationParamKey<Id> extends never
    ? [Id]
    : [Id, TranslationParams<Id>];
  function useT() {
    const [locale] = useLocale();

    function t<Id extends TranslationId>(...args: TArgs<Id>) {
      const [id, params] = args;
      const translation: string = resources[locale][id];

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
