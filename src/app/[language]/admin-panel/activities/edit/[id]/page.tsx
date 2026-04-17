import type { Metadata } from "next";
import EditActivity from "./page-content";
import { getServerTranslation, getI18nResources } from "@/services/i18n";
import TranslationsProvider from "@/services/i18n/translations-provider";

type Props = {
  params: Promise<{ language: string }>;
};

const NAMESPACES = ["admin-panel-activities-edit"];

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-activities-edit"
  );

  return {
    title: t("title"),
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const resources = await getI18nResources(params.language, NAMESPACES);

  return (
    <TranslationsProvider
      language={params.language}
      namespaces={NAMESPACES}
      resources={resources}
    >
      <EditActivity />
    </TranslationsProvider>
  );
}
