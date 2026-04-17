"use client";

import { createInstance, Resource } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { PropsWithChildren, useMemo } from "react";
import { getOptions } from "./config";

type Props = PropsWithChildren<{
  language: string;
  namespaces: string[];
  resources: Resource;
}>;

export default function TranslationsProvider({
  children,
  language,
  namespaces,
  resources,
}: Props) {
  const i18n = useMemo(() => {
    const instance = createInstance();
    instance.use(initReactI18next).init({
      ...getOptions(language, namespaces[0]),
      ns: namespaces,
      resources,
      partialBundledLanguages: true,
      initAsync: false,
    });
    return instance;
  }, [language, namespaces, resources]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
