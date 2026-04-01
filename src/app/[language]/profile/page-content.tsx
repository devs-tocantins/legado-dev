"use client";

import useAuth from "@/services/auth/use-auth";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import { useQuery } from "@tanstack/react-query";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { getLevel, getLevelProgress, formatXp } from "@/lib/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "@/components/link";
import { Mail, Pencil, User, Zap, Coins, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage
                src={user?.photo?.path}
                alt={`${user?.firstName} ${user?.lastName}`}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-2">
              <h1
                className="text-2xl font-bold tracking-tight"
                data-testid="user-name"
              >
                {user?.firstName} {user?.lastName}
              </h1>

              {profile?.username && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    @{profile.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-xs gap-1 text-muted-foreground"
                    render={<Link href={`/u/${profile.username}`} />}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver perfil público
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span data-testid="user-email" className="truncate">
                  {user?.email}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span>{user?.role?.name ?? "Membro"}</span>
              </div>
            </div>
          </div>

          {/* Gamification stats */}
          {!profileLoading && profile && (
            <div className="mt-5 space-y-3">
              {/* Level + progress */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", level.color)}>
                    {level.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* XP + Tokens */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Zap className="h-4 w-4 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-base font-bold leading-none">
                      {formatXp(profile.totalXp)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      XP Total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-base font-bold leading-none">
                      {profile.gratitudeTokens}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tokens
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button
              render={<Link href="/profile/edit" />}
              className="gap-2"
              data-testid="edit-profile"
            >
              <Pencil className="h-4 w-4" />
              Editar Perfil
            </Button>
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Ver Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withPageRequiredAuth(Profile);
