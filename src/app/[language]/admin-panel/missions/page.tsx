import type { Metadata } from "next";
import AdminMissionsPageContent from "./page-content";

export const metadata: Metadata = { title: "Admin — Missões" };

export default function Page() {
  return <AdminMissionsPageContent />;
}
