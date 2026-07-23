import { Metadata } from "next";
import CoursePageContent from "./page-content";

export const metadata: Metadata = {
  title: "Detalhes do Curso | legado.dev",
  description: "Veja os detalhes e avaliações deste curso.",
};

export default function CoursePage() {
  return <CoursePageContent />;
}
