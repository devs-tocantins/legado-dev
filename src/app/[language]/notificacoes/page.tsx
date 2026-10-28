import type { Metadata } from "next";
import NotificacoesPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Notificações",
};

export default function Page() {
  return <NotificacoesPageContent />;
}
