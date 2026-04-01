import type { Metadata } from "next";
import ActivitiesPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Atividades | Devs Tocantins",
};

export default function Page() {
  return <ActivitiesPageContent />;
}
