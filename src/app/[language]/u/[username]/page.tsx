import type { Metadata } from "next";
import PublicProfilePageContent from "./page-content";

export const metadata: Metadata = {
  title: "Perfil | Devs Tocantins",
};

export default function Page() {
  return <PublicProfilePageContent />;
}
