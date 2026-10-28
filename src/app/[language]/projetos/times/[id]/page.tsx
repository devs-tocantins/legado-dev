import type { Metadata } from "next";
import ProjectTeamPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Time do Projeto",
};

export default function Page() {
  return <ProjectTeamPageContent />;
}
