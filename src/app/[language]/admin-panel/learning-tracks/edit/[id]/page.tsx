import type { Metadata } from "next";
import TrackBuilder from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Editar Trilha — Admin" };
}

export default function Page() {
  return <TrackBuilder />;
}
