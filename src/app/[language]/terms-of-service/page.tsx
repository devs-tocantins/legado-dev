import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Link from "@/components/link";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "terms-of-service");
  return { title: t("title") };
}

const SECTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

async function TermsOfService(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "terms-of-service");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert prose-headings:font-heading prose-a:text-primary">
      <h1 data-testid="terms-of-service-title" className="text-3xl font-bold">
        {t("title")}
      </h1>
      <p className="text-muted-foreground">{t("lastUpdated")}</p>

      <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm not-prose">
        {t("intro_notice")}
      </div>

      {SECTION_NUMBERS.map((n) => {
        const paragraphs: string[] = [];
        let i = 1;
        while (true) {
          const key = `section_${n}_paragraph_${i}`;
          const value = t(key);
          if (value === key) break;
          paragraphs.push(value);
          i += 1;
        }

        return (
          <div key={n}>
            <h2 className="mt-10 text-xl font-semibold">
              {t(`section_${n}_title`)}
            </h2>
            <div className="space-y-4">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-6 p-4 border rounded-lg bg-muted/30 not-prose">
        <p className="font-medium">{t("contact_us_by_email")}</p>
        <a
          href="mailto:leonardovinicius9987@gmail.com"
          className="text-primary hover:underline"
        >
          leonardovinicius9987@gmail.com
        </a>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/privacy-policy" className="text-primary hover:underline">
          {params.language === "en"
            ? "Read the Privacy Policy"
            : "Ler a Política de Privacidade"}
        </Link>
      </p>
    </div>
  );
}

export default TermsOfService;
