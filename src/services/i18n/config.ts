export const fallbackLanguage = "pt-BR" as const;
export const languages = [fallbackLanguage, "en"] as const;
export const defaultNamespace = "common";
export const cookieName = "i18next";

export function getOptions(
  language: string = fallbackLanguage,
  namespace = defaultNamespace
) {
  return {
    debug: false,
    supportedLngs: languages,
    fallbackLng: fallbackLanguage,
    lng: language,
    load: "currentOnly" as const,
    fallbackNS: defaultNamespace,
    defaultNS: defaultNamespace,
    ns: namespace,
  };
}
