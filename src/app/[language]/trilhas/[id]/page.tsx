import type { Metadata } from "next";
import TrackDetailPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Trilha de Aprendizado",
};

export default function Page() {
  return <TrackDetailPageContent />;
}
