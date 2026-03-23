"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

// TODO: buscar GamificationProfile do endpoint GET /api/v1/gamification/profile
// TODO: exibir pontos, ranking e histórico de atividades do usuário

function DashboardPageContent() {
  const { t } = useTranslation("dashboard");

  return (
    <Container maxWidth="md">
      <Typography variant="h4" mt={3} gutterBottom>
        {t("title")}
      </Typography>
    </Container>
  );
}

export default withPageRequiredAuth(DashboardPageContent);
