import type { Metadata } from "next";
import SubmissionsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Minhas Submissões",
};

export default function Page() {
  return <SubmissionsPageContent />;
}
