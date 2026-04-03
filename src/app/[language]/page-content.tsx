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

// ─── Animation primitives ─────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease },
  },
};

const containerVariants = (staggerDelay = 0.12, childrenDelay = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerDelay, delayChildren: childrenDelay },
  },
});

// ─── Constellation network (deterministic, no hydration issues) ───────────────

const NODES = [
  { id: 0, cx: 5, cy: 12, r: 1.4 },
  { id: 1, cx: 16, cy: 30, r: 0.9 },
  { id: 2, cx: 27, cy: 7, r: 1.8 },
  { id: 3, cx: 40, cy: 22, r: 0.9 },
  { id: 4, cx: 53, cy: 9, r: 1.4 },
  { id: 5, cx: 67, cy: 26, r: 0.9 },
  { id: 6, cx: 79, cy: 7, r: 1.8 },
  { id: 7, cx: 89, cy: 20, r: 0.9 },
  { id: 8, cx: 96, cy: 40, r: 1.4 },
  { id: 9, cx: 11, cy: 54, r: 0.9 },
  { id: 10, cx: 23, cy: 72, r: 1.8 },
  { id: 11, cx: 37, cy: 57, r: 0.9 },
  { id: 12, cx: 51, cy: 67, r: 2.2 },
  { id: 13, cx: 65, cy: 50, r: 0.9 },
  { id: 14, cx: 80, cy: 64, r: 1.4 },
  { id: 15, cx: 93, cy: 78, r: 0.9 },
  { id: 16, cx: 33, cy: 87, r: 1.4 },
  { id: 17, cx: 59, cy: 84, r: 0.9 },
  { id: 18, cx: 73, cy: 92, r: 1.4 },
  { id: 19, cx: 47, cy: 38, r: 2.8 },
];

const EDGES = (() => {
  const result: { from: number; to: number }[] = [];
  const threshold = 26;
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

// ─── Floating fragments ───────────────────────────────────────────────────────

const FRAGMENTS = [
  { text: "git commit -m 'feat'", x: 5, y: 18, dur: 14, delay: 0 },
  { text: "+ 150 XP", x: 80, y: 13, dur: 17, delay: 2.1 },
  { text: "</contribuição>", x: 10, y: 66, dur: 19, delay: 0.9 },
  { text: "★ Hall da Fama", x: 74, y: 56, dur: 15, delay: 3.3 },
  { text: "npm publish", x: 56, y: 88, dur: 16, delay: 0.4 },
  { text: "{ open: source }", x: 1, y: 42, dur: 21, delay: 1.7 },
  { text: "PR #merged ✓", x: 85, y: 83, dur: 13, delay: 2.8 },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    title: "Catálogo de Atividades",
    desc: "Artigos, palestras, mentorias, open source — cada forma de contribuir tem seu peso documentado e pontuado.",
    accent: "#a78bfa",
  },
  {
    icon: Trophy,
    title: "Rankings em Tempo Real",
    desc: "Ranking mensal, anual e Hall da Fama. A competição saudável que move pessoas e transforma comunidades.",
    accent: "#fbbf24",
  },
  {
    icon: Shield,
    title: "Moderação Justa",
    desc: "Tudo o que entra no ranking passou por validação humana. Sem fraude, sem favorecimento, sem subjetividade.",
    accent: "#34d399",
  },
  {
    icon: Star,
    title: "Tokens de Gratidão",
    desc: "Todo mês você recebe tokens para reconhecer quem fez diferença pra você — sem acumular, sem esquecer.",
    accent: "#f87171",
  },
  {
    icon: Users,
    title: "Perfil Público",
    desc: "Seu histórico de contribuições fica público. Um currículo comunitário que cresce com cada ação.",
    accent: "#38bdf8",
  },
  {
    icon: Zap,
    title: "Atividades Secretas",
    desc: "QR codes em eventos desbloqueiam XP especial. Compareça, escaneie, seja recompensado por estar presente.",
    accent: "#818cf8",
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

// ─── Background: Aurora orbs ──────────────────────────────────────────────────

function AuroraOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          top: "-15%",
          left: "-12%",
          background:
            "radial-gradient(circle, oklch(0.52 0.22 285 / 0.25) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
        animate={{ x: [0, 28, -10, 18, 0], y: [0, 18, 42, 8, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "42vw",
          height: "42vw",
          bottom: "-12%",
          right: "-6%",
          background:
            "radial-gradient(circle, oklch(0.62 0.20 305 / 0.18) 0%, transparent 70%)",
          filter: "blur(56px)",
        }}
        animate={{ x: [0, -22, 12, -28, 0], y: [0, -28, 12, -14, 0] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "32vw",
          height: "32vw",
          top: "28%",
          left: "38%",
          background:
            "radial-gradient(circle, oklch(0.56 0.16 240 / 0.12) 0%, transparent 70%)",
          filter: "blur(64px)",
        }}
        animate={{ x: [0, 36, -18, 10, 0], y: [0, -18, 28, -8, 0] }}
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
      />
    </div>
  );
}

// ─── Background: Constellation ────────────────────────────────────────────────

function Constellation() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
            strokeWidth="0.08"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.18, 0.06, 0.18, 0] }}
            transition={{
              duration: 8 + (i % 5) * 1.5,
              delay: i * 0.14,
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
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.55, 0.25, 0.55],
              scale: [0.7, 1.15, 0.9, 1.1],
            }}
            transition={{
              duration: 6 + (node.id % 6),
              delay: node.id * 0.18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Background: Floating code fragments ─────────────────────────────────────

function FloatingFragments() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {FRAGMENTS.map((frag, i) => (
        <motion.span
          key={i}
          className="absolute font-mono text-[11px] text-white"
          style={{ left: `${frag.x}%`, top: `${frag.y}%` }}
          animate={{ y: [0, -14, 0], opacity: [0.05, 0.11, 0.05] }}
          transition={{
            duration: frag.dur,
            delay: frag.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {frag.text}
        </motion.span>
      ))}
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
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <main className="overflow-x-hidden">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.09 0.04 288) 0%, oklch(0.115 0.055 280) 45%, oklch(0.085 0.025 262) 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <AuroraOrbs />
        <Constellation />
        <FloatingFragments />

        {/* Hero content with parallax */}
        <motion.div
          className="relative z-10 mx-auto max-w-4xl px-6 text-center"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/65 backdrop-blur-sm"
          >
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            Motor de Engajamento · Devs Tocantins
          </motion.div>

          {/* Headline — staggered word reveal */}
          <motion.h1
            className="mb-6 font-bold leading-[1.08] tracking-tight text-white"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            variants={containerVariants(0.14, 0.18)}
            initial="hidden"
            animate="visible"
          >
            {[
              { text: "Contribua.", gradient: false },
              { text: "Evolua.", gradient: false },
              {
                text: "Seja reconhecido.",
                gradient: true,
              },
            ].map(({ text, gradient }, i) => (
              <motion.span key={i} variants={fadeUp} className="block">
                {gradient ? (
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, oklch(0.82 0.17 285), oklch(0.88 0.14 305))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {text}
                  </span>
                ) : (
                  text
                )}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/48 sm:text-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.62 }}
          >
            Ganhe XP por palestras, artigos, mentorias e open source. Suba no
            ranking e deixe um histórico permanente do seu impacto na
            comunidade.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.78 }}
          >
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-7 py-3 text-sm font-semibold text-gray-900 shadow-[0_0_32px_rgba(139,92,246,0.40)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(139,92,246,0.55)]"
            >
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/14 bg-white/[0.06] px-7 py-3 text-sm font-semibold text-white/78 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:border-white/24"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              Ver Ranking
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
        >
          <motion.div
            className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/18 pt-1.5"
            animate={{ opacity: [0.35, 0.75, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          >
            <motion.div
              className="h-1.5 w-0.5 rounded-full bg-white/55"
              animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats strip ───────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/25 py-12 px-4">
        <motion.div
          className="mx-auto grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
          variants={containerVariants(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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
          {/* Section header */}
          <motion.div
            className="mb-16 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary/70">
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

          {/* Cards */}
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants(0.09)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.22, ease } }}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/25"
              >
                {/* Radial glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(280px circle at 50% -20%, ${feature.accent}12 0%, transparent 70%)`,
                  }}
                />

                <div
                  className="mb-4 inline-flex rounded-xl p-2.5"
                  style={{ background: `${feature.accent}18` }}
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
        {/* Subtle gradient backdrop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 110%, oklch(0.52 0.22 285 / 0.07) 0%, transparent 70%)",
          }}
        />

        <motion.div
          className="relative mx-auto max-w-2xl text-center"
          variants={containerVariants(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.div
            variants={fadeUp}
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary/75"
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
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30"
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
