"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "@/components/link";
import {
  Zap,
  Trophy,
  Star,
  Users,
  ArrowRight,
  BookOpen,
  Shield,
} from "lucide-react";
import { useGetGamificationProfilesService } from "@/services/api/services/gamification-profiles";
import { SortEnum } from "@/services/api/types/sort-type";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { getLevel, formatXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

// ─── Animation primitives ─────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease },
  },
};

const staggerContainer = (delay = 0.11, childDelay = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: delay, delayChildren: childDelay },
  },
});

// ─── Constellation — deterministic nodes & edges ──────────────────────────────

const NODES = [
  { id: 0, cx: 3, cy: 8, r: 1.4 },
  { id: 1, cx: 14, cy: 22, r: 0.9 },
  { id: 2, cx: 7, cy: 42, r: 1.6 },
  { id: 3, cx: 18, cy: 60, r: 0.9 },
  { id: 4, cx: 4, cy: 75, r: 1.4 },
  { id: 5, cx: 14, cy: 88, r: 0.9 },
  { id: 6, cx: 28, cy: 96, r: 1.6 },
  { id: 7, cx: 86, cy: 5, r: 1.4 },
  { id: 8, cx: 96, cy: 18, r: 0.9 },
  { id: 9, cx: 91, cy: 34, r: 1.6 },
  { id: 10, cx: 97, cy: 52, r: 0.9 },
  { id: 11, cx: 88, cy: 68, r: 1.4 },
  { id: 12, cx: 96, cy: 82, r: 0.9 },
  { id: 13, cx: 80, cy: 93, r: 1.6 },
  { id: 14, cx: 22, cy: 6, r: 0.9 },
  { id: 15, cx: 70, cy: 4, r: 1.2 },
  { id: 16, cx: 44, cy: 97, r: 1.2 },
  { id: 17, cx: 63, cy: 95, r: 0.9 },
];

const EDGES = (() => {
  const result: { from: number; to: number }[] = [];
  const threshold = 24;
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const dx = NODES[i].cx - NODES[j].cx;
      const dy = NODES[i].cy - NODES[j].cy;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        result.push({ from: i, to: j });
      }
    }
  }
  return result;
})();

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    title: "Catálogo de Atividades",
    desc: "Artigos, palestras, mentorias, open source — cada forma de contribuir tem seu peso documentado e pontuado.",
    accent: "text-primary",
    accentBg: "bg-primary/10",
  },
  {
    icon: Trophy,
    title: "Rankings em Tempo Real",
    desc: "Ranking mensal, anual e Hall da Fama. A competição saudável que move pessoas e transforma comunidades.",
    accent: "text-amber-500",
    accentBg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Moderação Justa",
    desc: "Tudo o que entra passou por validação humana. Sem fraude, sem favorecimento, sem subjetividade.",
    accent: "text-emerald-500",
    accentBg: "bg-emerald-500/10",
  },
  {
    icon: Star,
    title: "Reconhecimento em XP",
    desc: "Todo mês você recebe pontos para reconhecer quem fez diferença — cada ponto enviado vira XP real para quem recebe.",
    accent: "text-amber-500",
    accentBg: "bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Perfil Público",
    desc: "Seu histórico de contribuições fica público. Um currículo comunitário que cresce com cada ação.",
    accent: "text-primary",
    accentBg: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Atividades Secretas",
    desc: "QR codes em eventos desbloqueiam XP especial. Compareça, escaneie, seja recompensado por estar presente.",
    accent: "text-accent",
    accentBg: "bg-accent/10",
  },
];

// ─── Constellation (theme-aware) ──────────────────────────────────────────────

function EdgeConstellation() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden text-foreground/[0.07] dark:text-foreground/[0.12]"
      style={{
        maskImage:
          "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 30%, black 72%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 30%, black 72%)",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden
      >
        {EDGES.map((edge, i) => (
          <motion.line
            key={i}
            x1={NODES[edge.from].cx}
            y1={NODES[edge.from].cy}
            x2={NODES[edge.to].cx}
            y2={NODES[edge.to].cy}
            stroke="currentColor"
            strokeWidth="0.3"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4, 1, 0] }}
            transition={{
              duration: 9 + (i % 5) * 1.8,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {NODES.map((node) => (
          <motion.circle
            key={node.id}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill="currentColor"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1] }}
            transition={{
              duration: 7 + (node.id % 6),
              delay: node.id * 0.22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Live ranking card ────────────────────────────────────────────────────────

function LiveRankingCard() {
  const fetchProfiles = useGetGamificationProfilesService();

  const { data, isLoading } = useQuery({
    queryKey: ["landing-ranking"],
    queryFn: async () => {
      try {
        const { status, data } = await fetchProfiles({
          page: 1,
          limit: 5,
          sort: [{ orderBy: "currentMonthlyXp", order: SortEnum.DESC }],
        });
        if (status === HTTP_CODES_ENUM.OK) return data.data;
      } catch {
        // endpoint indisponível — exibe lista vazia sem erro
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold">Top 5 — Este Mês</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">
          {monthLabel}
        </span>
      </div>

      <div className="divide-y divide-border">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3 animate-pulse"
              >
                <div className="h-3 w-4 bg-muted rounded" />
                <div className="flex-1 h-3 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
            ))
          : (data ?? []).map((profile, i) => {
              const level = getLevel(profile.totalXp);
              const xp = profile.currentMonthlyXp ?? 0;
              return (
                <Link
                  key={profile.id}
                  href={`/u/${profile.username}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate font-mono">
                    @{profile.username}
                  </span>
                  <span
                    className={cn("text-xs font-medium shrink-0", level.color)}
                  >
                    {level.name}
                  </span>
                  <span className="text-xs font-bold font-mono text-amber-500 shrink-0">
                    {formatXp(xp)} XP
                  </span>
                </Link>
              );
            })}
      </div>

      <div className="px-5 py-3 border-t border-border">
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4 font-medium"
        >
          Ver ranking completo
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

import { HeroLogo3D } from "@/components/hero-logo-3d";

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomePageContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <main className="overflow-x-hidden">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black"
      >
        <div className="absolute inset-0 z-0">
          <EdgeConstellation />
        </div>

        <motion.div
          className="relative z-10 w-full"
          style={{ opacity: heroOpacity }}
        >
          {/* Animated 3D Logo Section */}
          <div className="w-full max-w-7xl mx-auto">
            <HeroLogo3D />
          </div>

          {/* Action Buttons (Fade in after logo assembly) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 4, ease }}
            className="flex flex-col items-center gap-6 mt-8 px-6"
          >
            <p className="max-w-md text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
              Ganhe XP por palestras, artigos, mentorias e open source. Construa
              um histórico permanente do seu impacto na comunidade.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(229,155,19,0.3)]"
              >
                Começar agora
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-1 hover:bg-white/10"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                Ver Ranking
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Ranking Preview (Floating) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 5, ease }}
          className="hidden xl:block absolute right-10 top-1/2 -translate-y-1/2 z-20 w-80"
        >
          <LiveRankingCard />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.5 }}
        >
          <div className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/20 pt-1.5">
            <motion.div
              className="h-1.5 w-0.5 rounded-full bg-white/40"
              animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────── */}

      <section className="py-28 px-4">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-16 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              Como funciona
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Cada contribuição tem seu valor
            </h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Contribua de qualquer forma. Tudo é registrado, validado por
              humanos e recompensado de forma transparente.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer(0.09)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2, ease } }}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/40"
              >
                <div
                  className={cn(
                    "mb-4 inline-flex rounded-xl p-2.5",
                    feature.accentBg
                  )}
                >
                  <feature.icon className={cn("h-5 w-5", feature.accent)} />
                </div>
                <h3 className="mb-2 font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-28 px-4">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent"
          >
            Sua contribuição importa
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            De uma resposta no grupo
            <br className="hidden sm:block" />a uma palestra no maior evento do
            estado.
          </motion.h2>

          <motion.p variants={fadeUp} className="mb-10 text-muted-foreground">
            Tudo conta. Tudo fica registrado. Tudo é reconhecido.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            >
              Entrar na plataforma
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/activities"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted"
            >
              Ver atividades disponíveis
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
