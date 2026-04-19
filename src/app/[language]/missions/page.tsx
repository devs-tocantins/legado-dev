import type { Metadata } from "next";
import MissionsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Missões",
};

export default function Page() {
  return <MissionsPageContent />;
}
