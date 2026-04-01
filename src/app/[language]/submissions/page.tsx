import type { Metadata } from "next";
import SubmissionsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Minhas Submissões | Devs Tocantins",
};

export default function Page() {
  return <SubmissionsPageContent />;
}
