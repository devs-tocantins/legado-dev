import type { Metadata } from "next";
import EditEventPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Editar Evento",
};

export default function Page() {
  return <EditEventPageContent />;
}
