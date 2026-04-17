import type { Metadata } from "next";
import BadgesAdmin from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Badges — Admin" };
}

export default function Page() {
  return <BadgesAdmin />;
}
