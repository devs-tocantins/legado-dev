import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Link from "@/components/link";
import { Zap, Trophy, Shield, Star, Users, ArrowRight } from "lucide-react";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  await getServerTranslation(params.language, "common");
  return { title: `Devs Tocantins · Motor de Engajamento` };
}

export default async function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-background py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            Comunidade Devs Tocantins
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Cada contribuição <br />
            <span className="text-primary">vale pontos.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Ganhe XP por palestras, artigos, ajudar membros e participar de
            eventos. Suba no ranking e mostre seu impacto na comunidade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Ver Ranking
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Como funciona</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Simples: contribua, comprove, ganhe XP.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BookOpenIcon,
                title: "Catálogo de Atividades",
                desc: "Veja todas as formas de ganhar XP: artigos, palestras, mentorias, open source e muito mais.",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                icon: Trophy,
                title: "Rankings Competitivos",
                desc: "Ranking mensal, anual e Hall da Fama. Dispute com a comunidade e mostre quem é referência.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: Shield,
                title: "Moderação Justa",
                desc: "Tudo que entra no ranking passou por validação. Sem fraude, sem favorecimento.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Star,
                title: "Tokens de Gratidão",
                desc: "Todo mês você recebe tokens para agradecer quem te ajudou. Sem acumular, sem esquecer.",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
              },
              {
                icon: Users,
                title: "Perfil Público",
                desc: "Seu histórico de contribuições fica público. Mostre seu currículo comunitário.",
                color: "text-sky-500",
                bg: "bg-sky-500/10",
              },
              {
                icon: Zap,
                title: "Atividades Secretas",
                desc: "QR codes em eventos desbloqueiam pontos especiais. Compareça, escaneie, ganhe.",
                color: "text-primary",
                bg: "bg-primary/10",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border p-5 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div
                  className={`mb-3 inline-flex rounded-lg p-2 ${feature.bg}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-primary/5 py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold">Sua contribuição importa.</h2>
          <p className="mb-6 text-muted-foreground">
            De responder uma dúvida no grupo até palestrar no maior evento do
            estado — tudo conta. Tudo fica registrado. Tudo é reconhecido.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Entrar na plataforma
            </Link>
            <Link
              href="/activities"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Ver atividades disponíveis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// Inline icon workaround for server component (no client-side bundle needed)
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
