import type { Metadata } from "next";
import AdminEventsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Moderação de Eventos",
};

export default function Page() {
  return <AdminEventsPageContent />;
}
