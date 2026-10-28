import type { Metadata } from "next";
import EditProjectIdeaPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Editar Ideia de Projeto",
};

export default function Page() {
  return <EditProjectIdeaPageContent />;
}
