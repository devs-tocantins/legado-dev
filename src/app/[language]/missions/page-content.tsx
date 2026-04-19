"use client";

import { useQuery } from "@tanstack/react-query";
import { useGetMissionsService } from "@/services/api/services/missions";
import { Mission } from "@/services/api/types/mission";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "@/components/link";
import { Zap, Target, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function MissionCard({ mission }: { mission: Mission }) {
  const isClosed = mission.status === "CLOSED";

  return (
    <Card className={cn("flex flex-col", isClosed && "opacity-60")}>
      <CardContent className="flex-1 pt-4 pb-2 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {mission.title}
          </h3>
          <Badge
            variant={isClosed ? "secondary" : "default"}
            className="shrink-0 text-xs px-2"
          >
            {isClosed ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Encerrada
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                {mission.xpReward} XP
              </>
            )}
          </Badge>
        </div>

        {mission.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {mission.description}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-amber-500">
          <Target className="h-3 w-3" />
          <span>Missão única — apenas um vencedor</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-2">
        <Link
          href={`/missions/${mission.id}`}
          className={cn(
            "w-full inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            isClosed
              ? "bg-muted text-muted-foreground cursor-default pointer-events-none"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {isClosed ? "Ver detalhes" : "Participar"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function MissionsPageContent() {
  const getMissions = useGetMissionsService();

  const { data: missions, isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { status, data } = await getMissions();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
  });

  const open = missions?.filter((m) => m.status === "OPEN") ?? [];
  const closed = missions?.filter((m) => m.status === "CLOSED") ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Missões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Desafios únicos. Apenas uma pessoa pode vencer cada missão.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : open.length === 0 && closed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma missão disponível no momento.</p>
          <p className="text-sm mt-1">Volte em breve para novos desafios.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Abertas ({open.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {open.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Encerradas ({closed.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {closed.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
