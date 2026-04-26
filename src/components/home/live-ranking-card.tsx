"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useGetGamificationProfilesService } from "@/services/api/services/gamification-profiles";
import { SortEnum } from "@/services/api/types/sort-type";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { getLevel, formatXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import Link from "@/components/link";

export function LiveRankingCard() {
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
        // Fallback to empty array
      }
      return [];
    },
    refetchInterval: 60000,
  });

  return (
    <div className="rounded-3xl border border-border/50 bg-card/5 p-1 shadow-2xl backdrop-blur-xl">
      <div className="rounded-[22px] border border-border/50 bg-black/10 dark:bg-black/40 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">
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
                  className="h-12 w-full animate-pulse rounded-xl bg-muted/20"
                />
              ))
            : profiles?.slice(0, 5).map((profile, i) => {
                const level = getLevel(profile.totalXp);
                return (
                  <div
                    key={profile.id}
                    className="group flex items-center justify-between rounded-xl bg-muted/[0.05] p-2.5 transition-colors hover:bg-muted/[0.1]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 text-center text-xs font-bold opacity-30">
                        {i + 1}
                      </span>
                      <div className="relative">
                        <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-gradient-to-br from-muted to-transparent flex items-center justify-center text-[10px] font-bold text-muted-foreground">
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
                        <p className="max-w-[120px] truncate text-xs font-bold">
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
                      <p className="text-[9px] opacity-30">
                        {t("ranking_card.xp")}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>

        {profiles && profiles.length >= 5 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <Link
              href="/leaderboard"
              className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              {t("ranking_card.see_all")}
              <div className="h-1 w-1 rounded-full bg-primary" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
