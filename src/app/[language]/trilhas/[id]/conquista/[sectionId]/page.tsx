import type { Metadata } from "next";
import ConquistaPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Conquista do selo",
};

export default function Page() {
  return <ConquistaPageContent />;
}
