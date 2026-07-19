import type { Metadata } from "next";
import DashboardPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Meu Perfil",
};

export default function Page() {
  return <DashboardPageContent />;
}
