import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import HomePageContent from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  await getServerTranslation(params.language, "common");
  return { title: `Devs Tocantins · Motor de Engajamento` };
}

export default function Home() {
  return <HomePageContent />;
}
