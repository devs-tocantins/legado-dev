"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

// TODO: listar atividades disponíveis via GET /api/v1/activities
// TODO: implementar formulário de envio de submissão via POST /api/v1/submissions
// TODO: campos: activityId, proofUrl (link ou upload de arquivo)

function NewSubmissionPageContent() {
  const { t } = useTranslation("submissions");

  return (
    <Container maxWidth="md">
      <Typography variant="h4" mt={3} gutterBottom>
        {t("newTitle")}
      </Typography>
    </Container>
  );
}

export default withPageRequiredAuth(NewSubmissionPageContent);
