import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "home");

  return {
    title: t("title"),
  };
}

export default async function Home(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "home");

  return (
    <Container maxWidth="md">
      <Grid
        container
        spacing={3}
        direction="column"
        pt={3}
        sx={{ alignItems: "flex-start" }}
      >
        <Grid>
          <Typography variant="h3" data-testid="home-title" gutterBottom>
            {t("title")}
          </Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            color="primary"
            component={MuiLink}
            href="/sign-in"
            data-testid="sign-in-button"
            underline="none"
            sx={{ color: "white" }}
          >
            {t("signIn")}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
