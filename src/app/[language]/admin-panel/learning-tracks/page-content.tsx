"use client";

import { useCallback } from "react";
import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetLearningTracksService,
  useDeleteLearningTrackService,
} from "@/services/api/services/learning-tracks";
import {
  LearningTrack,
  LearningTrackStatus,
  LearningTrackTier,
} from "@/services/api/types/learning-track";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<LearningTrackTier, string> = {
  ALICERCE: "Alicerce",
  PILAR: "Pilar",
  ARCO: "Arco",
};

const STATUS_STYLE: Record<
  LearningTrackStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  PUBLISHED: {
    label: "Publicada",
    className: "bg-emerald-500/10 text-emerald-600",
  },
  ARCHIVED: {
    label: "Arquivada",
    className: "bg-amber-500/10 text-amber-600",
  },
};

const tracksQueryKey = ["admin-learning-tracks"];

function TrackRow({ track }: { track: LearningTrack }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteLearningTrackService();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleDelete = useCallback(async () => {
    const isConfirmed = await confirmDialog({
      title: "Excluir trilha",
      message: `Tem certeza que deseja excluir a trilha "${track.title}"? Isso também remove suas seções e marcos. Esta ação não pode ser desfeita.`,
    });
    if (!isConfirmed) return;
    try {
      await fetchDelete(track.id);
      await queryClient.invalidateQueries({ queryKey: tracksQueryKey });
      enqueueSnackbar("Trilha excluída", { variant: "success" });
    } catch {
      enqueueSnackbar("Erro ao excluir trilha", { variant: "error" });
    }
  }, [confirmDialog, fetchDelete, queryClient, track, enqueueSnackbar]);

  const statusStyle = STATUS_STYLE[track.status] ?? STATUS_STYLE.DRAFT;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="p-3">
        <p className="font-medium text-sm">{track.title}</p>
        <p className="text-xs text-muted-foreground font-mono">{track.slug}</p>
      </td>
      <td className="p-3 w-[140px] text-sm text-muted-foreground">
        {track.area}
      </td>
      <td className="p-3 w-[120px] text-sm">{TIER_LABELS[track.tier]}</td>
      <td className="p-3 w-[120px]">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            statusStyle.className
          )}
        >
          {statusStyle.label}
        </span>
      </td>
      <td className="p-3 w-[160px]">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            render={
              <Link href={`/admin-panel/learning-tracks/edit/${track.id}`} />
            }
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

function LearningTracksAdmin() {
  const fetchTracks = useGetLearningTracksService();

  const { data: tracks, isLoading } = useQuery({
    queryKey: tracksQueryKey,
    queryFn: async () => {
      const { status, data } = await fetchTracks({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trilhas de Aprendizado
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie e edite trilhas, seções e marcos
          </p>
        </div>
        <Button
          className="gap-2 bg-green-600 hover:bg-green-700"
          render={<Link href="/admin-panel/learning-tracks/create" />}
        >
          <Plus className="h-4 w-4" />
          Criar trilha
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 space-y-1.5">
                <div className="h-3 bg-muted rounded w-48" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        ) : !tracks || tracks.length === 0 ? (
          <EmptyState
            icon={Map}
            title="Nenhuma trilha cadastrada"
            description="Crie a primeira trilha para começar"
            action={{
              label: "Criar trilha",
              href: "/admin-panel/learning-tracks/create",
            }}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-10 px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Trilha
                </th>
                <th className="h-10 w-[140px] px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Área
                </th>
                <th className="h-10 w-[120px] px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Nível
                </th>
                <th className="h-10 w-[120px] px-3 text-left align-middle text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-10 w-[160px] px-3" />
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <TrackRow key={track.id} track={track} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(LearningTracksAdmin, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
