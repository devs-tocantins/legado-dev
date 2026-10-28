import type { Metadata } from "next";
import MyProjectsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Meus Projetos",
};

export default function Page() {
  return <MyProjectsPageContent />;
}
