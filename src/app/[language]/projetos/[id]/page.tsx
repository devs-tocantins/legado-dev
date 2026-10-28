import type { Metadata } from "next";
import ProjectIdeaDetailPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Ideia de Projeto",
};

export default function Page() {
  return <ProjectIdeaDetailPageContent />;
}
