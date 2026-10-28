"use client";

import { Minus, Plus, Sparkles } from "lucide-react";
import { PROJECT_ROLE_LABELS } from "@/lib/project-labels";
import { ProjectRole, SuggestedVacancy } from "@/services/api/types/project";
import { cn } from "@/lib/utils";

export const MAX_VACANCIES_PER_ROLE = 10;

export type VacancyCounts = Record<ProjectRole, number>;

export function emptyVacancyCounts(): VacancyCounts {
  return Object.values(ProjectRole).reduce(
    (acc, role) => ({ ...acc, [role]: 0 }),
    {} as VacancyCounts
  );
}

export function vacancyCountsFromList(
  list: { role: ProjectRole; quantity: number }[]
): VacancyCounts {
  const counts = emptyVacancyCounts();
  for (const item of list) counts[item.role] = item.quantity;
  return counts;
}

export function vacancyCountsToList(counts: VacancyCounts) {
  return Object.values(ProjectRole)
    .filter((role) => counts[role] > 0)
    .map((role) => ({ role, quantity: counts[role] }));
}

export function VacancyEditor({
  value,
  onChange,
  minimums,
  suggestions,
}: {
  value: VacancyCounts;
  onChange: (value: VacancyCounts) => void;
  /** Vagas já ocupadas por cargo — não dá para reduzir abaixo disso. */
  minimums?: Partial<Record<ProjectRole, number>>;
  suggestions?: SuggestedVacancy[];
}) {
  const suggestionByRole = new Map(suggestions?.map((s) => [s.role, s]));

  const setCount = (role: ProjectRole, next: number) => {
    const min = minimums?.[role] ?? 0;
    onChange({
      ...value,
      [role]: Math.min(MAX_VACANCIES_PER_ROLE, Math.max(min, next)),
    });
  };

  return (
    <div className="space-y-2">
      {Object.values(ProjectRole).map((role) => {
        const suggestion = suggestionByRole.get(role);
        const min = minimums?.[role] ?? 0;
        return (
          <div
            key={role}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
              value[role] > 0
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card"
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{PROJECT_ROLE_LABELS[role]}</p>
              {suggestion && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                  Sugerido: {suggestion.quantity} · {suggestion.reason}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={`Menos vagas de ${PROJECT_ROLE_LABELS[role]}`}
                onClick={() => setCount(role, value[role] - 1)}
                disabled={value[role] <= min}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center font-mono text-sm">
                {value[role]}
              </span>
              <button
                type="button"
                aria-label={`Mais vagas de ${PROJECT_ROLE_LABELS[role]}`}
                onClick={() => setCount(role, value[role] + 1)}
                disabled={value[role] >= MAX_VACANCIES_PER_ROLE}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
