import type { Metadata } from "next";
import SignUp from "./page-content";
import { getServerTranslation, getI18nResources } from "@/services/i18n";
import { redirect } from "next/navigation";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import TranslationsProvider from "@/services/i18n/translations-provider";

type Props = {
  params: Promise<{ language: string }>;
};

const NAMESPACES = ["sign-up", "common"];

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "sign-up");

  return {
    title: t("title"),
  };
}

export default async function SignUpPage(props: Props) {
  if (!IS_SIGN_UP_ENABLED) {
    return redirect("/");
  }

  const params = await props.params;
  const resources = await getI18nResources(params.language, NAMESPACES);

  return (
    <TranslationsProvider
      language={params.language}
      namespaces={NAMESPACES}
      resources={resources}
    >
      <SignUp />
    </TranslationsProvider>
  );
}
