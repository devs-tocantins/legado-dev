import type { Metadata } from "next";
import NewProjectIdeaPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Propor Ideia de Projeto",
};

export default function Page() {
  return <NewProjectIdeaPageContent />;
}
