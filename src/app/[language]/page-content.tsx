"use client";

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "@/components/link";
import { Zap, Trophy, Star, Users, ArrowRight } from "lucide-react";
import { useGetGamificationProfilesService } from "@/services/api/services/gamification-profiles";
import { SortEnum } from "@/services/api/types/sort-type";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { getLevel, formatXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function LiveRankingCard() {
  const { t } = useTranslation("home");
  const fetchProfiles = useGetGamificationProfilesService();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["live-ranking-hero"],
    queryFn: async () => {
      try {
        const { status, data } = await fetchProfiles({
          page: 1,
          limit: 5,
          sort: [{ orderBy: "totalXp", order: SortEnum.DESC }],
        });
        if (status === HTTP_CODES_ENUM.OK) return data.data;
      } catch {
        // Fallback to empty array if backend is unavailable
      }
      return [];
    },
    refetchInterval: 60000,
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
      <div className="rounded-[22px] border border-white/10 bg-black/40 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              {t("ranking_card.title")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
            <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
            {t("ranking_card.live")}
          </div>
        </div>

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded-xl bg-white/5"
                />
              ))
            : profiles?.map((profile, i) => {
                const level = getLevel(profile.totalXp);
                return (
                  <div
                    key={profile.id}
                    className="group flex items-center justify-between rounded-xl bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 text-center text-xs font-bold text-white/30">
                        {i + 1}
                      </span>
                      <div className="relative">
                        <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-[10px] font-bold text-white/60">
                          {profile.photo?.path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profile.photo.path}
                              alt={profile.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            profile.username.substring(0, 2).toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[120px] truncate text-xs font-bold text-white">
                          @{profile.username}
                        </p>
                        <p
                          className={cn(
                            "text-[9px] font-medium opacity-70",
                            level.color
                          )}
                        >
                          {level.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs font-bold text-amber-500">
                        {formatXp(profile.totalXp)}
                      </p>
                      <p className="text-[9px] text-white/30">
                        {t("ranking_card.xp")}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

function EdgeConstellation() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -right-[10%] -bottom-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomePageContent() {
  const { t } = useTranslation("home");
  const heroRef = useRef<HTMLDivElement>(null);
  const [introFinished, setIntroFinished] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);

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

  return (
    <main className="overflow-x-hidden">
      {/* ─── Hero Cinematic Section ────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative h-[95vh] min-h-[750px] flex items-center justify-center overflow-hidden bg-[#020307]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, #0d1326 0%, #050812 55%, #020307 100%)",
        }}
      >
        {/* Persistent Cinematic Background FX - Now in the section to fill it entirely */}
        <BgParticles />
        <FXOverlay />
        <EdgeConstellation />

        <motion.div
          className="relative z-10 w-full h-full max-w-7xl mx-auto flex items-center justify-center"
          style={{ opacity: heroOpacity }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* The Logo Group (Logo + Wordmark) */}
            <motion.div
              animate={{
                x: showContent
                  ? typeof window !== "undefined" && window.innerWidth < 1024
                    ? 0
                    : "-25%"
                  : "0%",
                y: showContent
                  ? typeof window !== "undefined" && window.innerWidth < 1024
                    ? "-15%"
                    : 0
                  : 0,
                scale: showContent ? 0.82 : 1,
              }}
              transition={{
                duration: 1.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative w-full h-full"
            >
              <HeroLogo3D
                onIntroComplete={handleIntroComplete}
                onReady={() => setIs3DReady(true)}
              />
            </motion.div>

            {/* Right Side Content (Actions & Ranking) */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
                  className="absolute right-6 lg:right-12 xl:right-20 top-[52%] lg:top-1/2 -translate-y-1/2 z-20 w-full max-w-[460px] px-6 lg:px-0 hidden lg:block"
                >
                  <div className="space-y-10 text-white">
                    <div className="space-y-4">
                      <h2 className="text-3xl lg:text-5xl font-bold tracking-tighter text-white">
                        legado<span className="text-[#E59B13]">.dev</span>
                      </h2>
                      <p className="text-lg lg:text-xl leading-relaxed text-white/80 font-medium">
                        {t("hero.description")}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href="/sign-up"
                        className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#E59B13] px-8 py-4 text-base font-bold text-white whitespace-nowrap transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(229,155,19,0.55)]"
                      >
                        {t("hero.cta")}
                        <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                      <Link
                        href="/leaderboard"
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-8 py-4 text-base font-bold text-white whitespace-nowrap transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                      >
                        <Trophy className="h-5 w-5 text-amber-400" />
                        {t("hero.ranking")}
                      </Link>
                    </div>

                    <div className="pt-6">
                      <LiveRankingCard />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Actions */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-12 left-0 right-0 z-20 px-8 lg:hidden flex flex-col items-center text-center gap-6"
                >
                  <p className="text-base text-white/70 font-medium">
                    {t("footer_cta.description")}
                  </p>
                  <div className="flex gap-4">
                    <Link
                      href="/sign-up"
                      className="rounded-xl bg-[#E59B13] px-7 py-3 text-sm font-bold text-white shadow-xl"
                    >
                      {t("hero.cta")}
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-bold text-white"
                    >
                      {t("ranking_card.title")}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: introFinished ? 1 : 0 }}
          transition={{ delay: 1 }}
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

      {/* ─── Features Section ──────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-background border-t border-border/50">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-20 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer(0.1)}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
              {t("features.title", { reconhecimento: "" })}
              <span className="text-primary italic">reconhecimento</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("features.description")}
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            <motion.div
              variants={fadeUp}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 text-foreground"
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
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 text-foreground"
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
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 text-foreground"
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-32 px-4 relative overflow-hidden border-t border-border/50 bg-background">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_bottom,var(--primary),transparent)]" />
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer(0.12)}
            className="space-y-8"
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground"
            >
              {t("footer_cta.title", { agora: "" })}
              <span className="text-primary">agora.</span>
            </motion.h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("footer_cta.description")}
            </p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground whitespace-nowrap shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
              >
                {t("footer_cta.button_join")}
              </Link>
              <Link
                href="/activities"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-8 py-4 text-base font-bold text-foreground whitespace-nowrap hover:bg-muted hover:-translate-y-1 transition-all"
              >
                {t("footer_cta.button_activities")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
