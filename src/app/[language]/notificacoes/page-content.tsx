"use client";

import React, { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useGetNotificationsService,
  useMarkAllReadService,
  useMarkReadService,
} from "@/services/api/services/notifications";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Bell, Check, ChevronDown } from "lucide-react";
import { NotificationIcon } from "@/components/notification-icon";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Notification } from "@/services/api/types/notification";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        if (!notification.isRead) {
          onMarkRead(notification.id);
        }
        if (notification.link) {
          router.push(notification.link);
        }
      }}
      className={cn(
        "group flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md cursor-pointer relative",
        !notification.isRead && "bg-primary/[0.03]"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          !notification.isRead ? "bg-primary" : "bg-transparent"
        )}
      />
      <div className="mt-1 shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-muted group-hover:bg-background transition-colors">
        <NotificationIcon type={notification.type} className="h-5 w-5" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug line-clamp-2">
            {notification.title}
          </h3>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground pt-0.5">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {notification.body}
        </p>
      </div>
    </div>
  );
}

function NotificacoesPageContent() {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const getNotifications = useGetNotificationsService();
  const markAllRead = useMarkAllReadService();
  const markRead = useMarkReadService();
  const queryClient = useQueryClient();

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["all-notifications"],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await getNotifications(
          { page: pageParam, limit: 20, all: true },
          { signal }
        );
        if (status === HTTP_CODES_ENUM.OK && data) {
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

  const allNotifications = useMemo<Notification[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") {
      return allNotifications.filter((n) => !n.isRead);
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const hasUnread = useMemo(
    () => allNotifications.some((n) => !n.isRead),
    [allNotifications]
  );

  const { mutate: doMarkAll } = useMutation({
    mutationFn: async () => {
      await markAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
    },
  });

  const { mutate: doMarkRead } = useMutation({
    mutationFn: async (id: string) => {
      await markRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notificações
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Acompanhe o seu histórico de novidades, alertas e atividades na
            plataforma.
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            className="gap-2 self-start md:self-auto"
            onClick={() => doMarkAll()}
          >
            <Check className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
        <button
          onClick={() => setFilter("ALL")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            filter === "ALL"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            filter === "UNREAD"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Não lidas
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Tudo limpo por aqui!"
          description={
            filter === "UNREAD"
              ? "Você não tem nenhuma notificação não lida."
              : "Seu histórico de notificações está vazio no momento."
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={doMarkRead}
              />
            ))}
          </div>

          {hasNextPage && filter === "ALL" && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4",
                    isFetchingNextPage && "animate-bounce"
                  )}
                />
                {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default withPageRequiredAuth(NotificacoesPageContent);
