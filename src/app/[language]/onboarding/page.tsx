import type { Metadata } from "next";
import OnboardingPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Bem-vindo ao legado.dev",
};

export default function Page() {
  return <OnboardingPageContent />;
}
