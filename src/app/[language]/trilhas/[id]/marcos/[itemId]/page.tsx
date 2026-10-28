import type { Metadata } from "next";
import CompleteMilestonePageContent from "./page-content";

export const metadata: Metadata = {
  title: "Marco da Trilha",
};

export default function Page() {
  return <CompleteMilestonePageContent />;
}
