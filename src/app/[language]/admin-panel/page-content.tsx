"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";

function AdminPanel() {
  const { t } = useTranslation("admin-panel-home");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-3">
        {t("title")}
      </h1>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { roles: [RoleEnum.ADMIN] });
