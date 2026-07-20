import type { Metadata } from "next";
import TrackSuggestionsAdmin from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sugestões de trilha — Admin" };
}

export default function Page() {
  return <TrackSuggestionsAdmin />;
}
