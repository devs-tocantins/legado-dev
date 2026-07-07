import type { Metadata } from "next";
import AdminWhatsappPageContent from "./page-content";

export const metadata: Metadata = {
  title: "WhatsApp - Admin",
};

export default function Page() {
  return <AdminWhatsappPageContent />;
}
