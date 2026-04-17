import type { Metadata } from "next";
import EditBadge from "./page-content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Editar Badge — Admin" };
}

export default function Page() {
  return <EditBadge />;
}
