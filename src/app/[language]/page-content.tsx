"use client";

import {
  m,
  useScroll,
  useTransform,
  AnimatePresence,
  LazyMotion,
  domMax,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";

import { Zap, Trophy, Star, Users, ArrowRight } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Home-specific components
import { LiveRankingCard } from "@/components/home/live-ranking-card";
import { EdgeConstellation } from "@/components/home/edge-constellation";
import { LatestActivitySection } from "@/components/home/latest-activity-section";

// Dynamic import for WebGL Canvas
const HeroLogo3D = dynamic(
  () => import("@/components/hero-logo-3d").then((mod) => mod.HeroLogo3D),
  { ssr: false }
);
const BgParticles = dynamic(
  () => import("@/components/hero-logo-3d").then((mod) => mod.BgParticles),
  { ssr: false }
);
const FXOverlay = dynamic(
  () => import("@/components/hero-logo-3d").then((mod) => mod.FXOverlay),
  { ssr: false }
);

// ─── Animation Variants ──────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease },
  },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomePageContent() {
  const { t } = useTranslation("home");
  const { resolvedTheme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const [introFinished, setIntroFinished] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkSize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 1024);
      setIsTablet(w >= 1024 && w < 1440);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  // Orchestrate the transition
  useEffect(() => {
    if (introFinished) {
      const timer = setTimeout(() => setShowContent(true), 600);
      return () => clearTimeout(timer);
    }
  }, [introFinished]);

  const handleIntroComplete = useCallback(() => {
    setIntroFinished(true);
  }, []);

  const isLight = mounted && resolvedTheme === "light";

  return (
    <LazyMotion features={domMax}>
      <main className="relative overflow-x-hidden">
        {/* ─── Hero Cinematic Section ────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative h-[95vh] min-h-[600px] lg:min-h-[750px] flex items-center justify-center overflow-hidden transition-colors duration-1000"
          style={{
            background: isLight
              ? "radial-gradient(ellipse at 50% 55%, #FDFBF7 0%, #F5F1E9 55%, #EBE4D8 100%)"
              : "radial-gradient(ellipse at 50% 55%, #0d1326 0%, #050812 55%, #020307 100%)",
          }}
        >
          {/* Cinematic Background FX */}
          <BgParticles />
          <FXOverlay />
          {!isLight && <EdgeConstellation />}

          <m.div
            className="relative z-10 w-full h-full max-w-7xl mx-auto flex items-center justify-center"
            style={{ opacity: heroOpacity }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* The Logo Group (Logo + Wordmark) - Now uses internal 3D transition */}
              <m.div className="relative w-full h-full">
                <AnimatePresence>
                  {!is3DReady && (
                    <m.div
                      key="loader"
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center z-50 bg-background"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs font-mono text-muted-foreground animate-pulse uppercase tracking-[0.2em]">
                          Initializing...
                        </p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>

                <HeroLogo3D
                  onReady={() => setIs3DReady(true)}
                  onIntroComplete={handleIntroComplete}
                  showContent={showContent}
                  isMobile={isMobile}
                  isTablet={isTablet}
                />
              </m.div>

              {/* Right Side Content (Actions & Ranking) */}
              <AnimatePresence>
                {showContent && (
                  <m.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
                    className="absolute right-6 lg:right-12 xl:right-20 top-[52%] lg:top-1/2 -translate-y-1/2 z-20 w-full max-w-[460px] px-6 lg:px-0 hidden lg:block"
                  >
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <h2 className="text-3xl lg:text-5xl font-bold tracking-tighter">
                          legado<span className="text-[#E59B13]">.dev</span>
                        </h2>
                        <p className="text-lg lg:text-xl leading-relaxed text-muted-foreground font-medium">
                          {t("hero.description")}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          size="lg"
                          className="h-14 px-8 text-lg font-bold rounded-xl group"
                          render={<Link href="/sign-up" />}
                        >
                          {t("hero.cta")}
                          <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-14 px-8 text-lg font-bold rounded-xl"
                          render={<Link href="/leaderboard" />}
                        >
                          <Trophy className="h-5 w-5 text-amber-500" />
                          {t("hero.ranking")}
                        </Button>
                      </div>

                      <div className="pt-6">
                        <LiveRankingCard />
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Mobile Actions */}
              <AnimatePresence>
                {showContent && (
                  <m.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-12 left-0 right-0 z-20 px-8 lg:hidden flex flex-col items-center text-center gap-6"
                  >
                    <p className="text-base text-muted-foreground font-medium">
                      {t("footer_cta.description")}
                    </p>
                    <div className="flex gap-4">
                      <Button
                        size="sm"
                        className="px-7 py-3 rounded-xl font-bold shadow-xl"
                        render={<Link href="/sign-up" />}
                      >
                        {t("hero.cta")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-7 py-3 rounded-xl font-bold"
                        render={<Link href="/leaderboard" />}
                      >
                        {t("ranking_card.title")}
                      </Button>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </m.div>

          {/* Scroll Indicator */}
          {introFinished && !isMobile && (
            <m.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/20 pt-1.5">
                <m.div
                  className="h-1.5 w-0.5 rounded-full bg-primary/40"
                  animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity }}
                />
              </div>
            </m.div>
          )}
        </section>

        {/* ─── Content Section ───────────────────────────────────────────── */}
        <div
          className={cn(
            "transition-all duration-1000 transform",
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          )}
        >
          {/* Features Section */}
          <section className="py-28 px-4 border-t border-border/50">
            <div className="mx-auto max-w-5xl">
              <m.div
                className="mb-20 text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer(0.1)}
              >
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                  {t("features.title", { reconhecimento: "" })}
                  <span className="text-primary italic">reconhecimento</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {t("features.description")}
                </p>
              </m.div>

              <div className="grid gap-8 md:grid-cols-3">
                <m.div
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight">
                    {t("features.xp.title")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {t("features.xp.description")}
                  </p>
                </m.div>

                <m.div
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-amber-500/10 p-3 text-amber-500">
                    <Star className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight">
                    {t("features.evolution.title")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {t("features.evolution.description")}
                  </p>
                </m.div>

                <m.div
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-500">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight">
                    {t("features.collective.title")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {t("features.collective.description")}
                  </p>
                </m.div>
              </div>
            </div>
          </section>

          <LatestActivitySection />

          {/* CTA Final */}
          <section className="py-32 px-4 relative overflow-hidden border-t border-border/50">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_bottom,var(--primary),transparent)]" />
            <div className="mx-auto max-w-3xl text-center relative z-10">
              <m.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer(0.12)}
                className="space-y-8"
              >
                <m.h2
                  variants={fadeUp}
                  className="text-4xl md:text-6xl font-bold tracking-tighter"
                >
                  {t("footer_cta.title", { agora: "" })}
                  <span className="text-primary">agora.</span>
                </m.h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t("footer_cta.description")}
                </p>
                <m.div
                  variants={fadeUp}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                    render={<Link href="/sign-up" />}
                  >
                    {t("footer_cta.button_join")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-lg font-bold rounded-xl"
                    render={<Link href="/activities" />}
                  >
                    {t("footer_cta.button_activities")}
                  </Button>
                </m.div>
              </m.div>
            </div>
          </section>
        </div>
      </main>
    </LazyMotion>
  );
}
