import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Link from "@/components/link";
import { Shield, FileText, ArrowRight } from "lucide-react";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "legal");
  return { title: t("title") };
}

async function LegalPage(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "legal");

  const docs = [
    {
      href: "/privacy-policy",
      icon: Shield,
      title: t("privacy_policy_title"),
      description: t("privacy_policy_description"),
    },
    {
      href: "/terms-of-service",
      icon: FileText,
      title: t("terms_of_service_title"),
      description: t("terms_of_service_description"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="group flex flex-col gap-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <doc.icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">{doc.title}</h2>
            <p className="flex-1 text-sm text-muted-foreground">
              {doc.description}
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              {t("read_more")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LegalPage;
