import type { Metadata } from "next";
import ModerationPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Moderação | Devs Tocantins",
};

export default function Page() {
  return <ModerationPageContent />;
}
