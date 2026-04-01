import type { Metadata } from "next";
import TransactionsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Histórico de Tokens | Devs Tocantins",
};

export default function Page() {
  return <TransactionsPageContent />;
}
