import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");
  return { title: t("title") };
}

async function PrivacyPolicy(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert prose-headings:font-heading prose-a:text-primary">
      <h1 data-testid="privacy-policy-title" className="text-3xl font-bold">
        {t("title")}
      </h1>
      <p className="text-muted-foreground">{t("lastUpdated")}</p>

      <div className="mt-8 space-y-4">
        <p>{t("description-1")}</p>
        <p>{t("description-2")}</p>
      </div>

      <h2 className="mt-10 text-xl font-semibold">
        {t("interpretation_and_definitions")}
      </h2>
      <p>{t("definitions_description")}</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>{t("account_title")}</strong> {t("account_description")}
        </li>
        <li>
          <strong>{t("company_title")}</strong> {t("company_description")}
        </li>
        <li>
          <strong>{t("personal_data_title")}</strong>{" "}
          {t("personal_data_definition")}
        </li>
        <li>
          <strong>{t("usage_data_title")}</strong> {t("usage_data_description")}
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold">
        {t("collecting_and_using_personal_data")}
      </h2>
      <h3 className="text-lg font-medium">{t("types_of_data_collected")}</h3>

      <div className="mt-4">
        <h4 className="font-bold">{t("personal_data")}</h4>
        <p>{t("personal_data_description")}</p>
      </div>

      <div className="mt-4">
        <h4 className="font-bold">{t("usage_data")}</h4>
        <p>{t("usage_data_auto_collected")}</p>
      </div>

      <h2 className="mt-10 text-xl font-semibold">
        {t("security_of_personal_data")}
      </h2>
      <p>{t("security_paragraph")}</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>{t("extra_services.vercel")}</li>
        <li>{t("extra_services.neon")}</li>
        <li>{t("extra_services.cloudflare")}</li>
        <li>{t("extra_services.brevo")}</li>
        <li>{t("extra_services.auth")}</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold">{t("contact_us")}</h2>
      <p>{t("contact_us_paragraph")}</p>

      <div className="mt-6 p-4 border rounded-lg bg-muted/30">
        <p className="font-medium">{t("contact_us_by_email")}</p>
        <a
          href="mailto:leonardovinicius9987@gmail.com"
          className="text-primary hover:underline"
        >
          leonardovinicius9987@gmail.com
        </a>
      </div>

      <div className="mt-8 space-y-2 text-sm text-muted-foreground">
        <p>{t("contact_us_on_website")}</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/devs-tocantins"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t("contact_us_on_github_discussions")}
          </a>
          <a
            href="https://discord.gg/your-invite-link"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t("contact_us_on_discord")}
          </a>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
