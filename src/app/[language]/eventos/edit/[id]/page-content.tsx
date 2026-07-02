"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useGetEventForManagementService } from "@/services/api/services/events";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { EventForm } from "../../event-form";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";

function EditEventPageContent() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const fetchEvent = useGetEventForManagementService();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-edit", id],
    queryFn: async () => {
      const { status, data } = await fetchEvent({ id });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={CalendarDays}
          title="Evento não encontrado"
          action={{ label: "Ver meus eventos", href: "/eventos/mine" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-7">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Editar evento
        </p>
        <h1 className="font-heading text-[28px] font-bold tracking-tight">
          {event.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alterações em eventos já aprovados avisam quem se inscreveu para
          receber atualizações.
        </p>
      </div>

      <EventForm
        event={event}
        onSuccess={() => {
          enqueueSnackbar("Evento atualizado!", { variant: "success" });
          router.push("/eventos/mine");
        }}
      />
    </div>
  );
}

export default withPageRequiredAuth(EditEventPageContent);
