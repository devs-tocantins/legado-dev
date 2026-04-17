import type { Metadata } from "next";
import TransactionsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Histórico de Tokens",
};

export default function Page() {
  return <TransactionsPageContent />;
}
