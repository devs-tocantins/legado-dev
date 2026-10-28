import type { Metadata } from "next";
import NewEventPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Divulgar Evento",
};

export default function Page() {
  return <NewEventPageContent />;
}
