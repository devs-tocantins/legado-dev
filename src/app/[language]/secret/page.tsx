import type { Metadata } from "next";
import { Suspense } from "react";
import SecretPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Resgatar Código | Devs Tocantins",
};

export default function Page() {
  return (
    <Suspense>
      <SecretPageContent />
    </Suspense>
  );
}
