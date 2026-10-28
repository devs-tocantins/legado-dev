"use client";

import { Users, Lightbulb } from "lucide-react";
import Link from "@/components/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  PROJECT_IDEA_STATUS_LABELS,
  PROJECT_ROLE_LABELS,
  PROJECT_TEAM_STATUS_LABELS,
  projectUserName,
} from "@/lib/project-labels";
import {
  ProjectIdea,
  ProjectIdeaStatus,
  ProjectRole,
  ProjectTeam,
  ProjectTeamStatus,
  ProjectUserSummary,
} from "@/services/api/types/project";

export const FIELD_CLASS =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export const IDEA_STATUS_CLASS: Record<ProjectIdeaStatus, string> = {
  [ProjectIdeaStatus.PENDING]: "bg-accent text-accent-foreground",
  [ProjectIdeaStatus.APPROVED]: "bg-primary text-primary-foreground",
  [ProjectIdeaStatus.REJECTED]: "bg-destructive text-destructive-foreground",
  [ProjectIdeaStatus.TEAM_FORMED]: "bg-emerald-600 text-white",
};

export const TEAM_STATUS_CLASS: Record<ProjectTeamStatus, string> = {
  [ProjectTeamStatus.RECRUITING]: "bg-primary text-primary-foreground",
  [ProjectTeamStatus.IN_PROGRESS]: "bg-accent text-accent-foreground",
  [ProjectTeamStatus.COMPLETED]: "bg-emerald-600 text-white",
  [ProjectTeamStatus.CANCELLED]: "bg-muted text-muted-foreground",
};

export function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}

export function RoleChip({
  role,
  children,
}: {
  role: ProjectRole;
  children?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
      {PROJECT_ROLE_LABELS[role]}
      {children}
    </span>
  );
}

export function UserChip({
  user,
  className,
}: {
  user?: ProjectUserSummary | null;
  className?: string;
}) {
  const name = projectUserName(user);
  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <Avatar size="sm">
        {user?.photo?.path && <AvatarImage src={user.photo.path} alt="" />}
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm font-medium">{name}</span>
    </span>
  );
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(options) as [T, string][]).map(([optValue, label]) => (
        <button
          key={optValue}
          type="button"
          onClick={() => onChange(optValue)}
          className={cn(
            "rounded-[9px] border px-3.5 py-2 text-[13px] font-medium transition-colors",
            value === optValue
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function IdeaCard({ idea }: { idea: ProjectIdea }) {
  return (
    <Link
      href={`/projetos/${idea.id}`}
      className="group flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-[15px] font-semibold leading-snug line-clamp-2">
          {idea.title}
        </h3>
        {idea.status === ProjectIdeaStatus.TEAM_FORMED && (
          <StatusPill
            label={PROJECT_IDEA_STATUS_LABELS[idea.status]}
            className={IDEA_STATUS_CLASS[idea.status]}
          />
        )}
      </div>
      <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
        {idea.description}
      </p>
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <UserChip user={idea.author} />
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {idea.interestCount}
        </span>
      </div>
    </Link>
  );
}

export function TeamCard({ team }: { team: ProjectTeam }) {
  const totalSlots = team.vacancies.reduce((sum, v) => sum + v.quantity, 0);
  const filledSlots = team.vacancies.reduce((sum, v) => sum + v.filled, 0);
  const openVacancies = team.vacancies.filter((v) => v.filled < v.quantity);

  return (
    <Link
      href={`/projetos/times/${team.id}`}
      className="group flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-[15px] font-semibold leading-snug line-clamp-2">
            {team.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3 shrink-0" />
            <span className="truncate">{team.ideaTitle}</span>
          </p>
        </div>
        <StatusPill
          label={PROJECT_TEAM_STATUS_LABELS[team.status]}
          className={TEAM_STATUS_CLASS[team.status]}
        />
      </div>
      {team.description && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {team.description}
        </p>
      )}
      {openVacancies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {openVacancies.map((vacancy) => (
            <RoleChip key={vacancy.role} role={vacancy.role}>
              <span className="font-mono text-muted-foreground">
                {vacancy.filled}/{vacancy.quantity}
              </span>
            </RoleChip>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <UserChip user={team.owner} />
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {filledSlots}/{totalSlots}
        </span>
      </div>
    </Link>
  );
}
