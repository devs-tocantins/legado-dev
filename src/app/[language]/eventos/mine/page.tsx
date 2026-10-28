import type { Metadata } from "next";
import MyEventsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Meus Eventos",
};

export default function Page() {
  return <MyEventsPageContent />;
}
