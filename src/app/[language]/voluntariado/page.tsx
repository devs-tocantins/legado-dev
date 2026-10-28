import type { Metadata } from "next";
import VoluntariadoPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Voluntariado",
};

export default function Page() {
  return <VoluntariadoPageContent />;
}
