import type { Metadata } from "next";
import { getServerTranslation, getI18nResources } from "@/services/i18n";
import TranslationsProvider from "@/services/i18n/translations-provider";
import HomePageContent from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  await getServerTranslation(params.language, "home");
  return {
    title: { absolute: "legado.dev — A sua história não será esquecida" },
  };
}

export default async function Home(props: Props) {
  const params = await props.params;
  const resources = await getI18nResources(params.language, ["home", "common"]);

  return (
    <TranslationsProvider
      language={params.language}
      namespaces={["home", "common"]}
      resources={resources}
    >
      <HomePageContent />
    </TranslationsProvider>
  );
}
