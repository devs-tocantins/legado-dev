import type { Metadata } from "next";
import CursosPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Catálogo de cursos",
};

export default function Page() {
  return <CursosPageContent />;
}
