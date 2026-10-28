import type { Metadata } from "next";
import AdminCoursesPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Moderação de Cursos",
};

export default function Page() {
  return <AdminCoursesPageContent />;
}
