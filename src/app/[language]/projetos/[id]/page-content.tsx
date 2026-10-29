"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  Lightbulb,
  Megaphone,
  Star,
} from "lucide-react";
import {
  useDeleteProjectInterestService,
  useGetMyProjectInterestService,
  useGetProjectGroupService,
  useGetProjectIdeaService,
  useGetProjectParticipantsService,
  usePatchProjectFeatureService,
  usePostProjectCallService,
  usePutProjectInterestService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  ProjectIdea,
  ProjectIdeaStatus,
  ProjectParticipant,
  ProjectUserSummary,
} from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { cn, getApiError } from "@/lib/utils";
import { projectUserName } from "@/lib/project-labels";
import { RoleEnum } from "@/services/api/types/role";
import { FIELD_CLASS } from "../project-components";

const MAX_STACK = 7;

const AVATAR_COLORS = [
  "bg-[#2f5fd8]",
  "bg-[#b4540a]",
  "bg-[#0f7b6c]",
  "bg-[#8a3fd1]",
  "bg-[#c0357a]",
  "bg-[#4d6b1f]",
];

function avatarColor(userId: number): string {
  return AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length];
}

function handleOf(user?: ProjectUserSummary | null): string {
  return user?.username ? `@${user.username}` : projectUserName(user);
}

function initialOf(user?: ProjectUserSummary | null): string {
  return projectUserName(user).charAt(0).toUpperCase();
}

function PersonAvatar({
  user,
  userId,
  className,
}: {
  user?: ProjectUserSummary | null;
  userId: number;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {user?.photo?.path && <AvatarImage src={user.photo.path} alt="" />}
      <AvatarFallback
        className={cn("font-semibold text-white", avatarColor(userId))}
      >
        {initialOf(user)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Fotos sobrepostas, no estilo do Instagram; passando do limite vira "+N". */
function AvatarStack({ people }: { people: ProjectParticipant[] }) {
  const visible = people.slice(0, MAX_STACK);
  const extra = people.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((person, index) => (
        <PersonAvatar
          key={person.userId}
          user={person.user}
          userId={person.userId}
          className={cn(
            "size-14 text-lg ring-[3px] ring-background after:hidden",
            index > 0 && "-ml-4"
          )}
        />
      ))}
      {extra > 0 && (
        <span className="-ml-4 flex size-14 items-center justify-center rounded-full bg-secondary text-[15px] font-semibold ring-[3px] ring-background">
          +{extra}
        </span>
      )}
    </div>
  );
}

/** Quem propôs chama os interessados e passa o link do grupo. */
function CallInterestedPanel({
  idea,
  onDone,
}: {
  idea: ProjectIdea;
  onDone: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const postCall = usePostProjectCallService();
  const [open, setOpen] = useState(false);
  const [groupLink, setGroupLink] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    try {
      const { status, data } = await postCall({
        ideaId: idea.id,
        groupLink: groupLink.trim(),
        message: message.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.OK || status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(
          `Chamada enviada para ${data.notified} ${
            data.notified === 1 ? "pessoa" : "pessoas"
          }.`,
          { variant: "success" }
        );
        setOpen(false);
        setMessage("");
        onDone();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao chamar os interessados."), {
          variant: "error",
        });
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-12 gap-2 px-[22px] text-[15px]"
      >
        <Megaphone className="size-4" />
        {idea.calledAt ? "Chamar de novo" : "Chamar interessados"}
      </Button>
    );
  }

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Crie um grupo (WhatsApp, Discord...) e cole o link aqui. Todo mundo que
        marcou interesse recebe um aviso e vê o botão para entrar.
      </p>
      <input
        type="url"
        value={groupLink}
        onChange={(event) => setGroupLink(event.target.value)}
        placeholder="https://chat.whatsapp.com/..."
        className={FIELD_CLASS}
        maxLength={300}
      />
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Recado opcional (ex.: vamos começar sábado às 9h)"
        className={FIELD_CLASS}
        rows={2}
        maxLength={300}
      />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={sending || !groupLink.trim()}>
          {sending ? "Enviando..." : "Enviar chamada"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function InterestSection({ idea }: { idea: ProjectIdea }) {
  const { user, isLoaded } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const fetchParticipants = useGetProjectParticipantsService();
  const getMyInterest = useGetMyProjectInterestService();
  const putInterest = usePutProjectInterestService();
  const deleteInterest = useDeleteProjectInterestService();

  const getGroup = useGetProjectGroupService();
  const [processing, setProcessing] = useState(false);
  const isAuthor = !!user && Number(user.id) === idea.authorId;

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["project-idea-participants", idea.id],
    queryFn: async () => {
      const { status, data } = await fetchParticipants({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
    enabled: !!user,
  });

  const { data: mine } = useQuery({
    queryKey: ["my-project-interest", idea.id],
    queryFn: async () => {
      const { status, data } = await getMyInterest({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!user,
  });

  const canSeeGroup =
    !!user && !!idea.calledAt && (isAuthor || !!mine?.interested);
  const { data: group } = useQuery({
    queryKey: ["project-idea-group", idea.id],
    queryFn: async () => {
      const { status, data } = await getGroup({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: canSeeGroup,
  });

  // Uma pessoa por linha, mesmo que tenha marcado interesse mais de uma vez.
  const people = participants.filter(
    (participant, index, list) =>
      list.findIndex((item) => item.userId === participant.userId) === index
  );
  const joined = !!mine?.interested;

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["project-idea-participants", idea.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["my-project-interest", idea.id],
    });
    queryClient.invalidateQueries({ queryKey: ["project-idea", idea.id] });
    queryClient.invalidateQueries({
      queryKey: ["project-idea-group", idea.id],
    });
  };

  const handleToggle = async () => {
    setProcessing(true);
    try {
      const { status, data } = joined
        ? await deleteInterest({ ideaId: idea.id })
        : await putInterest({ ideaId: idea.id });
      const ok = joined
        ? status === HTTP_CODES_ENUM.NO_CONTENT
        : status === HTTP_CODES_ENUM.OK || status === HTTP_CODES_ENUM.CREATED;
      if (ok) {
        enqueueSnackbar(
          joined ? "Interesse removido." : "Interesse registrado!",
          { variant: "success" }
        );
        refresh();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao atualizar interesse."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!isLoaded) return null;

  if (!user) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-[26px] font-bold tracking-tight">
          Quem tem interesse
        </h2>
        <p className="text-[15px] text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-semibold text-primary hover:underline"
          >
            Entre na sua conta
          </Link>{" "}
          para ver quem tem interesse e marcar o seu.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex max-w-[620px] flex-col gap-1.5">
          <h2 className="text-[26px] font-bold tracking-tight">
            Quem tem interesse
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Marque que você quer participar. Quando houver gente suficiente,
            quem propôs chama o grupo e vocês se organizam juntos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {group?.groupLink && (
            <Button
              render={
                <a
                  href={group.groupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="h-12 gap-2 px-[22px] text-[15px]"
            >
              <ExternalLink className="size-4" />
              Entrar no grupo
            </Button>
          )}
          {isAuthor && <CallInterestedPanel idea={idea} onDone={refresh} />}
          <Button
            variant={joined ? "outline" : "default"}
            onClick={handleToggle}
            disabled={processing}
            className="h-12 px-[22px] text-[15px]"
          >
            {joined ? "Remover meu interesse" : "Tenho interesse"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : people.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguém ainda. Seja a primeira pessoa a marcar interesse.
        </p>
      ) : (
        <>
          <AvatarStack people={people} />
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-5 border-t border-border pt-7">
            {people.map((person) => (
              <li
                key={person.userId}
                className="flex min-w-0 items-center gap-3"
              >
                <PersonAvatar
                  user={person.user}
                  userId={person.userId}
                  className="size-11 text-[15px] after:hidden"
                />
                {person.user?.username ? (
                  <Link
                    href={`/u/${person.user.username}`}
                    className="min-w-0 truncate text-[15px] font-medium hover:underline"
                  >
                    {handleOf(person.user)}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate text-[15px] font-medium">
                    {handleOf(person.user)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Só moderação: escolhe qual é o projeto da vez. */
function FeatureToggle({ idea }: { idea: ProjectIdea }) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const patchFeature = usePatchProjectFeatureService();
  const [saving, setSaving] = useState(false);
  const featured = !!idea.featuredAt;

  const handleClick = async () => {
    setSaving(true);
    try {
      const { status, data } = await patchFeature({
        ideaId: idea.id,
        featured: !featured,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(
          featured ? "Destaque removido." : "Agora é o projeto da vez!",
          { variant: "success" }
        );
        queryClient.invalidateQueries({ queryKey: ["project-idea", idea.id] });
        queryClient.invalidateQueries({ queryKey: ["public-project-ideas"] });
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao atualizar o destaque."), {
          variant: "error",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={saving}
      className="w-fit gap-2"
    >
      <Star className="size-4" />
      {featured ? "Remover de projeto da vez" : "Marcar como projeto da vez"}
    </Button>
  );
}

function ProjectIdeaDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const fetchIdea = useGetProjectIdeaService();
  const { user } = useAuth();
  const isModerator =
    !!user?.role &&
    [RoleEnum.ADMIN, RoleEnum.MODERATOR].includes(Number(user.role.id));

  const { data: idea, isLoading } = useQuery({
    queryKey: ["project-idea", id],
    queryFn: async () => {
      const { status, data } = await fetchIdea({ id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
        <EmptyState
          icon={Lightbulb}
          title="Projeto não encontrado"
          description="Ele não existe ou ainda não foi aprovado."
          action={{ label: "Ver projetos", href: "/projetos" }}
        />
      </div>
    );
  }

  const open =
    idea.status === ProjectIdeaStatus.APPROVED ||
    idea.status === ProjectIdeaStatus.TEAM_FORMED;

  return (
    <div className="mx-auto flex max-w-[1160px] flex-col gap-12 px-4 pb-24 pt-8 sm:px-6">
      <header className="flex flex-col gap-5">
        <Link
          href="/projetos"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Projetos
        </Link>

        <div className="flex max-w-[860px] flex-col gap-4">
          {idea.featuredAt ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
              <Star aria-hidden="true" className="size-3.5" />
              Projeto da vez
            </span>
          ) : (
            open && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <span
                  aria-hidden="true"
                  className="size-[7px] rounded-full bg-emerald-400"
                />
                Aberto a interessados
              </span>
            )
          )}
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[44px]">
            {idea.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              user={idea.author}
              userId={idea.authorId}
              className="size-8 text-xs after:hidden"
            />
            <span className="text-sm text-muted-foreground">
              Proposto por{" "}
              <span className="font-semibold text-foreground">
                {handleOf(idea.author)}
              </span>
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">
              {idea.interestCount}
            </strong>{" "}
            {idea.interestCount === 1 ? "interessado" : "interessados"}
          </span>
        </div>

        {isModerator && open && <FeatureToggle idea={idea} />}

        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {idea.teamId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4">
          <p className="text-sm font-medium">Este projeto já tem um time.</p>
          <Button render={<Link href={`/projetos/times/${idea.teamId}`} />}>
            Ver time
          </Button>
        </div>
      )}

      <InterestSection idea={idea} />

      <section className="flex max-w-[760px] flex-col gap-6">
        <h2 className="text-[26px] font-bold tracking-tight">
          Sobre o projeto
        </h2>
        <p className="whitespace-pre-line text-base leading-[1.7] text-foreground/80">
          {idea.description}
        </p>
      </section>
    </div>
  );
}

export default ProjectIdeaDetailPageContent;
