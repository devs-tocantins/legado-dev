import type { Metadata } from "next";
import CreateLearningTrack from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Criar Trilha — Admin" };
}

export default function Page() {
  return <CreateLearningTrack />;
}
