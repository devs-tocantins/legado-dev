import type { Metadata } from "next";
import LeaderboardPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Ranking | Devs Tocantins",
};

export default function Page() {
  return <LeaderboardPageContent />;
}
