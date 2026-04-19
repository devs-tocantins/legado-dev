"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useQuery } from "@tanstack/react-query";
import {
  useGetAdminMetricsService,
  useGetAdminHealthService,
  type AdminHealth,
} from "@/services/api/services/badges";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import Link from "@/components/link";
import {
  Users,
  ShieldCheck,
  Ban,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Zap,
  Coins,
  Activity,
  Medal,
  Target,
  ArrowRight,
  Database,
  Mail,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 flex items-start gap-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          colorClass ?? "bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            colorClass
              ? colorClass.replace("bg-", "text-").replace("/10", "")
              : "text-primary"
          )}
        />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-5 flex items-center gap-4 hover:border-primary/50 hover:bg-accent transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}

// ─── Health section ───────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<
  keyof Omit<AdminHealth, "allOk">,
  { label: string; Icon: React.ElementType }
> = {
  database: { label: "Banco de Dados (Neon)", Icon: Database },
  smtp: { label: "E-mail (Brevo SMTP)", Icon: Mail },
  storage: { label: "Armazenamento (R2)", Icon: HardDrive },
};

function HealthSection() {
  const fetchHealth = useGetAdminHealthService();
  const {
    data: health,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const { status, data } = await fetchHealth();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Saude dos Servicos
        </h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 h-16 animate-pulse"
            />
          ))}
        </div>
      ) : health ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            Object.keys(SERVICE_LABELS) as Array<keyof typeof SERVICE_LABELS>
          ).map((key) => {
            const svc = health[key];
            const { label, Icon } = SERVICE_LABELS[key];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border p-4 flex items-center gap-3",
                  svc.ok
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    svc.ok ? "bg-emerald-500/10" : "bg-destructive/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      svc.ok ? "text-emerald-500" : "text-destructive"
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p
                    className={cn(
                      "text-xs",
                      svc.ok
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    )}
                  >
                    {svc.ok ? "Operacional" : (svc.error ?? "Falha")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nao foi possivel verificar o status dos servicos.
        </p>
      )}
    </section>
  );
}

function AdminPanel() {
  const fetchMetrics = useGetAdminMetricsService();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { status, data } = await fetchMetrics();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">
          Visao geral da plataforma legado.dev
        </p>
      </div>

      {/* Metrics */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Metricas
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-5 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Usuarios totais"
              value={metrics.totalUsers}
              icon={Users}
              colorClass="bg-primary/10"
            />
            <MetricCard
              label="Usuarios ativos"
              value={metrics.activeUsers}
              icon={CheckCircle2}
              colorClass="bg-emerald-500/10"
            />
            <MetricCard
              label="Usuarios banidos"
              value={metrics.bannedUsers}
              icon={Ban}
              colorClass="bg-destructive/10"
            />
            <MetricCard
              label="Submissoes pendentes"
              value={metrics.submissionsPending}
              icon={ClipboardList}
              colorClass="bg-amber-500/10"
            />
            <MetricCard
              label="Aprovadas este mes"
              value={metrics.submissionsApprovedThisMonth}
              icon={CheckCircle2}
              colorClass="bg-emerald-500/10"
            />
            <MetricCard
              label="Rejeitadas este mes"
              value={metrics.submissionsRejectedThisMonth}
              icon={XCircle}
              colorClass="bg-destructive/10"
            />
            <MetricCard
              label="XP distribuido"
              value={`${metrics.totalXpDistributed} XP`}
              icon={Zap}
              colorClass="bg-primary/10"
            />
            <MetricCard
              label="Pts. reconhecimento em circulacao"
              value={metrics.tokensInCirculation}
              icon={Coins}
              colorClass="bg-amber-500/10"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nao foi possivel carregar as metricas.
          </p>
        )}
      </section>

      {/* Health */}
      <HealthSection />

      {/* Navigation */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Gerenciar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NavCard
            href="/admin-panel/activities"
            icon={Activity}
            label="Atividades"
            description="Criar, editar e remover atividades da plataforma"
          />
          <NavCard
            href="/admin-panel/submissions"
            icon={ClipboardList}
            label="Submissoes"
            description="Revisar e gerenciar submissoes de usuarios"
          />
          <NavCard
            href="/admin-panel/gamification-profiles"
            icon={Users}
            label="Perfis de gamificacao"
            description="Gerenciar XP, tokens e penalidades"
          />
          <NavCard
            href="/admin-panel/missions"
            icon={Target}
            label="Missoes"
            description="Criar missoes unicas e revisar participacoes"
          />
          <NavCard
            href="/admin-panel/badges"
            icon={Medal}
            label="Badges"
            description="Criar badges e conceder manualmente a usuarios"
          />
          <NavCard
            href="/admin-panel/transactions"
            icon={Coins}
            label="Transacoes"
            description="Historico de todas as movimentacoes"
          />
          <NavCard
            href="/admin-panel/users"
            icon={ShieldCheck}
            label="Usuarios"
            description="Gerenciar contas de usuarios"
          />
        </div>
      </section>
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { roles: [RoleEnum.ADMIN] });
