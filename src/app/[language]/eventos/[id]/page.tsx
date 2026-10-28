import type { Metadata } from "next";
import EventDetailPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Detalhes do Evento",
};

export default function Page() {
  return <EventDetailPageContent />;
}
