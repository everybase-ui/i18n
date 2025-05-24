import { createContext, useContext, useState } from 'react';

export function createI18n<
  Resources extends Record<string, Record<string, string>>,
>(resources: Resources) {
  type Locale = keyof Resources;
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

  type TranslationId = keyof Resources[Locale];

  function useT() {
    const [locale] = useLocale();

    function t<Id extends TranslationId>(id: Id) {
      return resources[locale][id];
    }

    return t;
  }

  interface TProps<Id extends TranslationId> {
    id: Id;
  }
  function T<Id extends TranslationId>({ id }: TProps<Id>) {
    return useT()(id);
  }

  return {
    useLocale,
    useT,
    Provider,
    T,
  };
}
