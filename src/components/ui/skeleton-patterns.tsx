import { Card, CardContent, CardFooter } from "@/components/ui/card";

// SkeletonStatCards — 4 cards de métricas em grid
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border bg-card p-4 space-y-3">
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-7 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-28" />
        </div>
      ))}
    </div>
  );
}

// SkeletonLeaderboard — pódio (3 blocos) + 7 linhas de tabela
export function SkeletonLeaderboard() {
  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className="flex items-end gap-3 h-60">
        {[48, 60, 44].map((h, i) => (
          <div
            key={i}
            className="animate-pulse bg-muted rounded-lg flex-1"
            style={{ height: `${h * 4}px` }}
          />
        ))}
      </div>
      {/* Table rows */}
      <div className="rounded-lg border overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-4 px-4 py-3 border-b last:border-0"
          >
            <div className="h-3 bg-muted rounded w-6" />
            <div className="flex-1 h-3 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-20 hidden sm:block" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// SkeletonProfile — capa + avatar + 4 cards + feed de contribuições
export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      {/* Cover */}
      <div className="animate-pulse h-36 bg-muted rounded-xl" />
      {/* Avatar + info */}
      <div className="animate-pulse flex items-start gap-4 -mt-10 px-2">
        <div className="h-16 w-16 bg-muted rounded-full border-4 border-background shrink-0" />
        <div className="flex-1 pt-10 space-y-2">
          <div className="h-5 bg-muted rounded w-36" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
      {/* Stat cards */}
      <SkeletonStatCards count={4} />
      {/* Feed */}
      <SkeletonFeed rows={5} />
    </div>
  );
}

// SkeletonFeed — N linhas com ícone + texto + valor
export function SkeletonFeed({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse flex items-center gap-3 px-4 py-3"
        >
          <div className="h-4 w-4 bg-muted rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-40" />
            <div className="h-3 bg-muted rounded w-24" />
          </div>
          <div className="h-3 bg-muted rounded w-14" />
        </div>
      ))}
    </div>
  );
}

// SkeletonActivityGrid — grid de cards de atividade
export function SkeletonActivityGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="pt-4 pb-2 px-4 space-y-2">
            <div className="flex justify-between gap-2">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-5 bg-muted rounded w-16" />
            </div>
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2 mt-1" />
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-2">
            <div className="h-8 bg-muted rounded w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
