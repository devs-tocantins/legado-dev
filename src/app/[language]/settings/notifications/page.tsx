import type { Metadata } from "next";
import NotificationSettingsPageContent from "./page-content";

export const metadata: Metadata = { title: "Notificações — Configurações" };

export default function Page() {
  return <NotificationSettingsPageContent />;
}
