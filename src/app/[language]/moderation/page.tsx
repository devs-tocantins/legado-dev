import type { Metadata } from "next";
import ModerationPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Moderação",
};

export default function Page() {
  return <ModerationPageContent />;
}
