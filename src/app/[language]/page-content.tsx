"use client";

import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  animate,
} from "framer-motion";
import { useRef, useEffect } from "react";
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

// ─── Tokens ───────────────────────────────────────────────────────────────────
// Community identity: navy + blue + orange/amber

const BLUE = "#3b82f6";
const ORANGE = "#f97316";
const NAVY = "#050d1c";

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

// ─── Constellation — nodes & edges (deterministic) ───────────────────────────

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
    accent: BLUE,
  },
  {
    icon: Trophy,
    title: "Rankings em Tempo Real",
    desc: "Ranking mensal, anual e Hall da Fama. A competição saudável que move pessoas e transforma comunidades.",
    accent: ORANGE,
  },
  {
    icon: Shield,
    title: "Moderação Justa",
    desc: "Tudo o que entra passou por validação humana. Sem fraude, sem favorecimento, sem subjetividade.",
    accent: "#22c55e",
  },
  {
    icon: Star,
    title: "Tokens de Gratidão",
    desc: "Todo mês você recebe tokens para reconhecer quem fez diferença pra você — sem acumular, sem esquecer.",
    accent: ORANGE,
  },
  {
    icon: Users,
    title: "Perfil Público",
    desc: "Seu histórico de contribuições fica público. Um currículo comunitário que cresce com cada ação.",
    accent: BLUE,
  },
  {
    icon: Zap,
    title: "Atividades Secretas",
    desc: "QR codes em eventos desbloqueiam XP especial. Compareça, escaneie, seja recompensado por estar presente.",
    accent: ORANGE,
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 120, suffix: "+", label: "Membros ativos" },
  { value: 34, suffix: "", label: "Tipos de atividade" },
  { value: 18, suffix: "", label: "Eventos realizados" },
  { value: 100, suffix: "%", label: "Moderação humana" },
];

// ─── AnimatedCounter ──────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(mv, value, { duration: 1.8, ease: "easeOut" });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix;
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [isInView, value, suffix, mv]);

  return (
    <span ref={ref} className="tabular-nums">
      0{suffix}
    </span>
  );
}

// ─── Background: edge constellation ──────────────────────────────────────────
// Masked so it only shows at the periphery — never behind the center text.

function EdgeConstellation() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
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
            stroke="white"
            strokeWidth="0.1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.14, 0.05, 0.14, 0] }}
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
            fill="white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.22, 0.5] }}
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

// ─── Background: corner glow orbs ────────────────────────────────────────────

function CornerOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Top-left — blue */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          top: "-18%",
          left: "-14%",
          background: `radial-gradient(circle, ${BLUE}28 0%, transparent 70%)`,
          filter: "blur(52px)",
        }}
        animate={{ x: [0, 18, -8, 14, 0], y: [0, 14, 30, 6, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Bottom-right — orange */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "38vw",
          height: "38vw",
          bottom: "-14%",
          right: "-8%",
          background: `radial-gradient(circle, ${ORANGE}22 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{ x: [0, -16, 10, -22, 0], y: [0, -22, 10, -12, 0] }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
      />
      {/* Top-right — blue, smaller */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "24vw",
          height: "24vw",
          top: "-8%",
          right: "8%",
          background: `radial-gradient(circle, ${BLUE}18 0%, transparent 70%)`,
          filter: "blur(44px)",
        }}
        animate={{ x: [0, -10, 8, -6, 0], y: [0, 16, -4, 10, 0] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 12,
        }}
      />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomePageContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <main className="overflow-x-hidden">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #071020 55%, #040b18 100%)`,
        }}
      >
        {/* Dot grid — very subtle */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <CornerOrbs />
        <EdgeConstellation />

        {/* Hero content */}
        <motion.div
          className="relative z-10 mx-auto max-w-4xl px-6 text-center"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm"
          >
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: ORANGE }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            Motor de Engajamento · Devs Tocantins
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mb-6 font-bold leading-[1.08] tracking-tight text-white"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            variants={staggerContainer(0.15, 0.2)}
            initial="hidden"
            animate="visible"
          >
            <motion.span variants={fadeUp} className="block">
              Contribua.
            </motion.span>
            <motion.span variants={fadeUp} className="block">
              Evolua.
            </motion.span>
            <motion.span variants={fadeUp} className="block">
              <span
                style={{
                  backgroundImage: `linear-gradient(90deg, ${BLUE}, ${ORANGE})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Seja reconhecido.
              </span>
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.65 }}
          >
            Ganhe XP por palestras, artigos, mentorias e open source. Suba no
            ranking e deixe um histórico permanente do seu impacto na
            comunidade.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.8 }}
          >
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-[#070f1e] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/92"
            >
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/16 bg-white/[0.06] px-7 py-3 text-sm font-semibold text-white/75 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:border-white/22"
            >
              <Trophy className="h-4 w-4" style={{ color: ORANGE }} />
              Ver Ranking
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <motion.div
            className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/15 pt-1.5"
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          >
            <motion.div
              className="h-1.5 w-0.5 rounded-full bg-white/50"
              animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats strip ───────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20 py-12 px-4">
        <motion.div
          className="mx-auto grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <div
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: i % 2 === 0 ? BLUE : ORANGE }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
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
            <div
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: BLUE }}
            >
              Como funciona
            </div>
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
                className="group relative rounded-2xl border border-border bg-card p-6 transition-colors duration-200 hover:border-border/80"
              >
                {/* Top-edge accent line on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feature.accent}60, transparent)`,
                  }}
                />

                <div
                  className="mb-4 inline-flex rounded-xl p-2.5"
                  style={{ background: `${feature.accent}14` }}
                >
                  <feature.icon
                    className="h-5 w-5"
                    style={{ color: feature.accent }}
                  />
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
      <section className="relative overflow-hidden border-t border-border/40 py-28 px-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 110%, ${BLUE}09 0%, transparent 65%)`,
          }}
        />

        <motion.div
          className="relative mx-auto max-w-2xl text-center"
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.div
            variants={fadeUp}
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: ORANGE }}
          >
            Sua contribuição importa
          </motion.div>

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
              className="group inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: BLUE }}
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
