"use client";

import useAuth from "@/services/auth/use-auth";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import { useQuery } from "@tanstack/react-query";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  getLevel,
  getLevelProgress,
  getNextLevelXp,
  formatXp,
} from "@/lib/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  Mail,
  Pencil,
  Zap,
  Coins,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BANNER_PRESETS } from "@/app/[language]/u/[username]/page-content";

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      {icon}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  const fetchMyProfile = useGetMyGamificationProfileService();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const totalXp = profile?.totalXp ?? 0;
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const nextLevelXp = getNextLevelXp(totalXp);
  const xpToNext = Math.max(0, nextLevelXp - totalXp);
  const isMaxLevel = level.maxXp === Infinity;
  const banner =
    BANNER_PRESETS[profile?.bannerPreset ?? "default"] ??
    BANNER_PRESETS.default;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      {/* Identidade */}
      <section className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className={cn("h-28 w-full", banner.className)} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <Avatar className="h-20 w-20 shrink-0 border-4 border-card shadow-sm">
              <AvatarImage
                src={user?.photo?.path}
                alt={`${user?.firstName} ${user?.lastName}`}
              />
              <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap justify-end gap-2 pb-1">
              {profile?.username && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  render={<Link href={`/u/${profile.username}`} />}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Perfil público
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5"
                data-testid="edit-profile"
                render={<Link href="/profile/edit" />}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar perfil
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="text-xl font-bold tracking-tight"
                data-testid="user-name"
              >
                {user?.firstName} {user?.lastName}
              </h1>
              <Badge variant="secondary">{user?.role?.name ?? "Membro"}</Badge>
            </div>
            {profile?.username && (
              <p className="font-mono text-sm text-muted-foreground">
                @{profile.username}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span data-testid="user-email" className="truncate">
                {user?.email}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Progressão de nível */}
      {!profileLoading && profile && (
        <section className="space-y-3 rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nível atual
              </p>
              <p className={cn("text-lg font-bold", level.color)}>
                {level.name}
              </p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              {isMaxLevel
                ? "Nível máximo alcançado"
                : `Faltam ${formatXp(xpToNext)} XP para o próximo nível`}
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{formatXp(level.minXp)} XP</span>
            <span>{progress}%</span>
            <span>{isMaxLevel ? "∞" : `${formatXp(level.maxXp + 1)} XP`}</span>
          </div>
        </section>
      )}

      {/* Stats */}
      {!profileLoading && profile && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={<Zap className="h-4 w-4 shrink-0 text-blue-500" />}
            value={formatXp(profile.totalXp)}
            label="XP Total"
          />
          <StatTile
            icon={<CalendarDays className="h-4 w-4 shrink-0 text-sky-500" />}
            value={formatXp(profile.currentMonthlyXp ?? 0)}
            label="XP Mensal"
          />
          <StatTile
            icon={<Coins className="h-4 w-4 shrink-0 text-amber-500" />}
            value={profile.gratitudeTokens}
            label="Pts. Reconhecimento"
          />
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(Profile);
