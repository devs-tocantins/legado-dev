import type { Metadata } from "next";
import NewProjectTeamPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Montar Time",
};

export default function Page() {
  return <NewProjectTeamPageContent />;
}
