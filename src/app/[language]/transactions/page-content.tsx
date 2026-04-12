"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGetMyTransactionsService } from "@/services/api/services/transactions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Transaction,
  TransactionCategoryEnum,
} from "@/services/api/types/transaction";
import {
  Zap,
  Coins,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

const CATEGORY_META: Record<
  TransactionCategoryEnum,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    unit: "XP" | "Token" | "auto";
  }
> = {
  [TransactionCategoryEnum.XP_REWARD]: {
    label: "Submissão aprovada",
    icon: Zap,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    unit: "XP",
  },
  [TransactionCategoryEnum.MODERATOR_REWARD]: {
    label: "Recompensa de auditoria",
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/10",
    unit: "XP",
  },
  [TransactionCategoryEnum.TOKEN_REWARD]: {
    label: "Gratidão recebida",
    icon: ArrowDownLeft,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    unit: "Token",
  },
  [TransactionCategoryEnum.TOKEN_TRANSFER]: {
    label: "Gratidão enviada",
    icon: ArrowUpRight,
    color: "text-muted-foreground",
    bg: "bg-muted",
    unit: "Token",
  },
  [TransactionCategoryEnum.STORE_PURCHASE]: {
    label: "Compra na loja",
    icon: Coins,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    unit: "Token",
  },
  [TransactionCategoryEnum.MANUAL_ADJUSTMENT]: {
    label: "Ajuste administrativo",
    icon: TrendingDown,
    color: "text-destructive",
    bg: "bg-destructive/10",
    unit: "auto",
  },
};

// Fictional category for monthly reset (if it ever appears via description)
const MONTHLY_RESET_KEYWORDS = ["renovação mensal", "monthly reset"];

function getMetaForTx(tx: Transaction) {
  const desc = tx.description?.toLowerCase() ?? "";
  if (MONTHLY_RESET_KEYWORDS.some((k) => desc.includes(k))) {
    return {
      label: "Renovação mensal — tokens restaurados",
      icon: RefreshCw,
      color: "text-muted-foreground",
      bg: "bg-muted",
      unit: "Token" as const,
    };
  }
  return (
    CATEGORY_META[tx.category] ??
    CATEGORY_META[TransactionCategoryEnum.MANUAL_ADJUSTMENT]
  );
}

function formatAmount(tx: Transaction): { text: string; cls: string } {
  const meta = getMetaForTx(tx);
  const isPositive = tx.amount > 0;
  const unit = meta.unit === "auto" ? (tx.amount < 0 ? "XP" : "XP") : meta.unit;
  const sign = isPositive ? "+" : "";
  const text = `${sign}${tx.amount} ${unit}`;
  const cls = isPositive
    ? "text-emerald-500"
    : meta.unit === "Token" ||
        tx.category === TransactionCategoryEnum.TOKEN_TRANSFER
      ? "text-muted-foreground"
      : "text-destructive";
  return { text, cls };
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function groupByDay(
  txs: Transaction[]
): { day: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const day = new Date(tx.createdAt).toISOString().slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(tx);
    map.set(day, list);
  }
  return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const meta = getMetaForTx(tx);
  const Icon = meta.icon;
  const { text, cls } = formatAmount(tx);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          meta.bg
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{meta.label}</p>
        {tx.description && (
          <p className="text-xs text-muted-foreground truncate">
            {tx.description}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right space-y-0.5">
        <p className={cn("text-sm font-semibold font-mono tabular-nums", cls)}>
          {text}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {formatTime(tx.createdAt)}
        </p>
      </div>
    </div>
  );
}

function TransactionsPageContent() {
  const fetchMyTransactions = useGetMyTransactionsService();

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["my-transactions"],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await fetchMyTransactions(
          { page: pageParam, limit: 20 },
          { signal }
        );
        if (status === HTTP_CODES_ENUM.OK) {
          return {
            data: data.data,
            nextPage: data.hasNextPage ? pageParam + 1 : undefined,
          };
        }
        return { data: [], nextPage: undefined };
      },
      getNextPageParam: (lastPage) => lastPage?.nextPage,
      gcTime: 0,
    });

  const allTx: Transaction[] = data?.pages.flatMap((p) => p?.data ?? []) ?? [];
  const groups = groupByDay(allTx);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Histórico de Tokens e XP
        </h1>
        <p className="text-sm text-muted-foreground">
          Todas as movimentações do seu perfil
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-card divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse px-4 py-3 flex items-center gap-3"
            >
              <div className="h-8 w-8 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-36" />
                <div className="h-3 bg-muted rounded w-52" />
              </div>
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      ) : allTx.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={Receipt}
            title="Seu extrato está vazio"
            description="Faça sua primeira contribuição para ganhar XP!"
            action={{
              label: "Ver atividades disponíveis",
              href: "/activities",
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ day, items }) => (
            <div key={day}>
              {/* Sticky day header */}
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm py-1.5 mb-1">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {formatDayLabel(items[0].createdAt)}
                </p>
              </div>
              <div className="rounded-lg border bg-card">
                {items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            <ChevronDown
              className={cn("h-4 w-4", isFetchingNextPage && "animate-bounce")}
            />
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(TransactionsPageContent);
