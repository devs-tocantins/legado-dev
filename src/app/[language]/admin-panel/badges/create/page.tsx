import type { Metadata } from "next";
import CreateBadge from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Criar Badge — Admin" };
}

export default function Page() {
  return <CreateBadge />;
}
