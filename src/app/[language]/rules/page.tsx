import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "rules");
  return { title: t("title") };
}

async function RulesPage(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "rules");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert prose-headings:font-heading prose-a:text-primary">
      <h1
        data-testid="rules-title"
        className="text-4xl font-bold tracking-tight mb-2"
      >
        {t("title")}
      </h1>
      <p className="text-xl text-muted-foreground mb-12">{t("subtitle")}</p>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t("voluntary.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("voluntary.description")}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t("local.title")}
          </h2>
          <p className="text-base leading-relaxed">{t("local.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t("equality.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("equality.description")}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t("gratitude.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("gratitude.description")}
          </p>
        </section>

        <section className="bg-muted/30 p-8 rounded-2xl border border-border mt-16">
          <h2 className="text-xl font-bold text-foreground mb-2 mt-0">
            {t("summary.title")}
          </h2>
          <p className="text-sm text-muted-foreground italic mb-0">
            {t("summary.description")}
          </p>
        </section>
      </div>
    </div>
  );
}

export default RulesPage;
