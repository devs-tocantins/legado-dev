import type { Metadata } from "next";
import MissionDetailPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Missão",
};

export default function Page() {
  return <MissionDetailPageContent />;
}
