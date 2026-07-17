import type { Metadata } from "next";
import TrilhasPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Trilhas de Aprendizado",
};

export default function Page() {
  return <TrilhasPageContent />;
}
