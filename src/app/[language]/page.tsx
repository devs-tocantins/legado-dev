import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
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

export default function Home() {
  return <HomePageContent />;
}
