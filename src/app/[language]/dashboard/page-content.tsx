"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function DashboardPageContent() {
  const { t } = useTranslation("dashboard");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {t("title")}
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("submissions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{t("submissionsDescription")}</p>
            <Button render={<Link href="/submissions/new" />}>
              {t("newSubmission")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(DashboardPageContent);
