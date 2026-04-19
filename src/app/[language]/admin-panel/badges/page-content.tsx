"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useCallback } from "react";
import { useGetBadgesQuery, badgesQueryKeys } from "./queries/queries";
import { Badge, BadgeCategoryEnum } from "@/services/api/services/badges";
import { useDeleteBadgeService } from "@/services/api/services/badges";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useQueryClient } from "@tanstack/react-query";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Medal, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<
  BadgeCategoryEnum,
  { label: string; className: string }
> = {
  MILESTONE: { label: "Marco", className: "bg-primary/10 text-primary" },
  RANKING: { label: "Ranking", className: "bg-amber-500/10 text-amber-600" },
  PARTICIPATION: {
    label: "Participação",
    className: "bg-emerald-500/10 text-emerald-600",
  },
  SPECIAL: { label: "Especial", className: "bg-violet-500/10 text-violet-600" },
};

function CategoryBadge({ category }: { category: BadgeCategoryEnum }) {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.SPECIAL;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style.className
      )}
    >
      {style.label}
    </span>
  );
}

function BadgeRow({ badge }: { badge: Badge }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteBadgeService();
  const queryClient = useQueryClient();

  const handleDelete = useCallback(async () => {
    const isConfirmed = await confirmDialog({
      title: "Excluir badge",
      message: `Tem certeza que deseja excluir o badge "${badge.name}"? Esta acao nao pode ser desfeita.`,
    });
    if (!isConfirmed) return;
    await fetchDelete(badge.id);
    await queryClient.invalidateQueries({
      queryKey: badgesQueryKeys.list().key,
    });
  }, [badge, confirmDialog, fetchDelete, queryClient]);

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-3">
          {badge.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={badge.imageUrl}
              alt={badge.name}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
              <Medal className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{badge.name}</p>
            {badge.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {badge.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="p-3 w-[150px]">
        <CategoryBadge category={badge.category} />
      </td>
      <td className="p-3 w-[100px]">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            badge.isActive
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge.isActive ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="p-3 w-[140px]">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            render={<Link href={`/admin-panel/badges/edit/${badge.id}`} />}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            Excluir
          </Button>
        </div>
      </td>
    </tr>
  );
}

function BadgesAdmin() {
  const { data: badges, isLoading } = useGetBadgesQuery();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os badges da plataforma
          </p>
        </div>
        <Button
          className="gap-2 bg-green-600 hover:bg-green-700"
          render={<Link href="/admin-panel/badges/create" />}
        >
          <Plus className="h-4 w-4" />
          Criar badge
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-3 flex items-center gap-3"
              >
                <div className="h-8 w-8 bg-muted rounded shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-40" />
                  <div className="h-3 bg-muted rounded w-60" />
                </div>
              </div>
            ))}
          </div>
        ) : !badges || badges.length === 0 ? (
          <EmptyState
            icon={Medal}
            title="Nenhum badge cadastrado"
            description="Crie o primeiro badge para comecar"
            action={{
              label: "Criar badge",
              href: "/admin-panel/badges/create",
            }}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-10 px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Badge
                </th>
                <th className="h-10 w-[150px] px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="h-10 w-[100px] px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-10 w-[160px] px-3" />
              </tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <BadgeRow key={badge.id} badge={badge} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(BadgesAdmin, { roles: [RoleEnum.ADMIN] });
