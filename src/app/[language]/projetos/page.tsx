import type { Metadata } from "next";
import ProjectsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Projetos da Comunidade",
};

export default function Page() {
  return <ProjectsPageContent />;
}
