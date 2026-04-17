import { createInstance, Resource } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";
import { getOptions } from "./config";

const initI18next = async (language: string, namespaces: string[]) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (lang: string, ns: string) => import(`./locales/${lang}/${ns}.json`)
      )
    )
    .init({ ...getOptions(language, namespaces[0]), ns: namespaces });

  return i18nInstance;
};

export async function getServerTranslation(
  language: string,
  namespace: string | string[],
  options: { keyPrefix?: string } = {}
) {
  const ns = Array.isArray(namespace) ? namespace : [namespace];
  const i18nextInstance = await initI18next(language, ns);

  return {
    t: i18nextInstance.getFixedT(language, ns[0], options.keyPrefix),
    i18n: i18nextInstance,
  };
}

export async function getI18nResources(
  language: string,
  namespaces: string[]
): Promise<Resource> {
  const i18nextInstance = await initI18next(language, namespaces);
  return i18nextInstance.store.data as Resource;
}
