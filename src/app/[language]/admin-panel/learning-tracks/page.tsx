import type { Metadata } from "next";
import LearningTracksAdmin from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Trilhas — Admin" };
}

export default function Page() {
  return <LearningTracksAdmin />;
}
