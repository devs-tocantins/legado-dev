"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useLanguage from "@/services/i18n/use-language";

// O Dashboard foi fundido em "Meu Perfil" (/profile), que virou a tela com
// XP, submissões recentes, conquistas e ações rápidas. Mantemos essa rota
// como redirecionamento pra não quebrar links/favoritos antigos.
function DashboardPageContent() {
  const router = useRouter();
  const language = useLanguage();

  useEffect(() => {
    router.replace(`/${language}/profile`);
  }, [router, language]);

  return null;
}

export default DashboardPageContent;
