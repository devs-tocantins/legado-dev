"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useLanguage from "@/services/i18n/use-language";

// "Missões" virou uma sub-aba de "Voluntariado" (junto com "Atividades").
// Mantemos essa rota como redirecionamento pra não quebrar links antigos.
// A rota de detalhe /missions/[id] continua funcionando normalmente.
export default function MissionsPageContent() {
  const router = useRouter();
  const language = useLanguage();

  useEffect(() => {
    router.replace(`/${language}/voluntariado`);
  }, [router, language]);

  return null;
}
