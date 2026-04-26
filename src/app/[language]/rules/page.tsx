import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Link from "@/components/link";
import { ArrowRight, Heart, MapPin, Users, Zap } from "lucide-react";

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

  const rules = [
    {
      icon: Heart,
      title: t("voluntary.title"),
      description: t("voluntary.description"),
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: MapPin,
      title: t("local.title"),
      description: t("local.description"),
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Users,
      title: t("equality.title"),
      description: t("equality.description"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Zap,
      title: t("gratitude.title"),
      description: t("gratitude.description"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="mb-16 text-center">
        <h1
          data-testid="rules-title"
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
        >
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rules.map((rule) => (
          <div
            key={rule.title}
            className="p-8 rounded-3xl border border-border bg-card shadow-sm"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${rule.bg} ${rule.color} flex items-center justify-center mb-6`}
            >
              <rule.icon className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">{rule.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {rule.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-muted/30 p-8 md:p-12 rounded-3xl border border-border text-center">
        <h2 className="text-2xl font-bold mb-4">{t("summary.title")}</h2>
        <p className="text-lg text-muted-foreground italic mb-8 max-w-2xl mx-auto">
          {t("summary.description")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/submissions/new"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Começar a pontuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-3 text-sm font-bold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RulesPage;
