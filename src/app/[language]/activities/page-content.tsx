"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useLanguage from "@/services/i18n/use-language";

// "Atividades" virou uma sub-aba de "Voluntariado" (junto com "Missões").
// Mantemos essa rota como redirecionamento pra não quebrar links antigos.
function ActivitiesPageContent() {
  const router = useRouter();
  const language = useLanguage();

  useEffect(() => {
    router.replace(`/${language}/voluntariado`);
  }, [router, language]);

  return null;
}

export default ActivitiesPageContent;
