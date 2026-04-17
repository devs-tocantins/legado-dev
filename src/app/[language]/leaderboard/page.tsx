import type { Metadata } from "next";
import LeaderboardPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Ranking",
};

export default function Page() {
  return <LeaderboardPageContent />;
}
