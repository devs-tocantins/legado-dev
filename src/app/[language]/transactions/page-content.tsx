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
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  ChevronDown,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<
  TransactionCategoryEnum,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    sign: "+" | "-" | "";
  }
> = {
  [TransactionCategoryEnum.XP_REWARD]: {
    label: "XP Recompensa",
    icon: Zap,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    sign: "+",
  },
  [TransactionCategoryEnum.MODERATOR_REWARD]: {
    label: "Recompensa Moderador",
    icon: Zap,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    sign: "+",
  },
  [TransactionCategoryEnum.TOKEN_REWARD]: {
    label: "Token Recebido",
    icon: ArrowDownLeft,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    sign: "+",
  },
  [TransactionCategoryEnum.TOKEN_TRANSFER]: {
    label: "Token Enviado",
    icon: ArrowUpRight,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    sign: "-",
  },
  [TransactionCategoryEnum.STORE_PURCHASE]: {
    label: "Compra na Loja",
    icon: Coins,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    sign: "-",
  },
  [TransactionCategoryEnum.MANUAL_ADJUSTMENT]: {
    label: "Ajuste Manual",
    icon: Settings2,
    color: "text-muted-foreground",
    bg: "bg-muted",
    sign: "",
  },
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const meta =
    CATEGORY_META[tx.category] ??
    CATEGORY_META[TransactionCategoryEnum.MANUAL_ADJUSTMENT];
  const Icon = meta.icon;
  const isPositive = tx.amount > 0;
  const isXp =
    tx.category === TransactionCategoryEnum.XP_REWARD ||
    tx.category === TransactionCategoryEnum.MODERATOR_REWARD;

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
        <p className="text-xs text-muted-foreground">
          {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-semibold",
            isPositive ? "text-emerald-500" : "text-rose-500"
          )}
        >
          {isPositive ? "+" : ""}
          {tx.amount} {isXp ? "XP" : "Token"}
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

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse px-4 py-3 flex items-center gap-3"
              >
                <div className="h-8 w-8 bg-muted rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-48" />
                </div>
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : allTx.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhuma transação ainda. Submeta atividades para ganhar XP!
            </p>
          </div>
        ) : (
          <div>
            {allTx.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

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
