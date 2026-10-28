import type { Metadata } from "next";
import EventsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Agenda de Eventos",
};

export default function Page() {
  return <EventsPageContent />;
}
