"use client";

import { EffortLevelEnum, EffortTier } from "@/services/api/types/activity";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const EFFORT_LEVEL_ORDER: EffortLevelEnum[] = [
  EffortLevelEnum.P,
  EffortLevelEnum.M,
  EffortLevelEnum.G,
  EffortLevelEnum.EPICO,
];

const EFFORT_LEVEL_LABELS: Record<EffortLevelEnum, string> = {
  [EffortLevelEnum.P]: "P — Pequeno",
  [EffortLevelEnum.M]: "M — Médio",
  [EffortLevelEnum.G]: "G — Grande",
  [EffortLevelEnum.EPICO]: "Épico",
};

function tierFor(tiers: EffortTier[], level: EffortLevelEnum): EffortTier {
  return (
    tiers.find((t) => t.level === level) ?? {
      level,
      label: "",
      example: "",
      xp: 0,
    }
  );
}

export function EffortTiersFields({
  tiers,
  onChange,
}: {
  tiers: EffortTier[];
  onChange: (tiers: EffortTier[]) => void;
}) {
  const updateTier = (level: EffortLevelEnum, patch: Partial<EffortTier>) => {
    const next = EFFORT_LEVEL_ORDER.map((l) => {
      const current = tierFor(tiers, l);
      return l === level ? { ...current, ...patch } : current;
    });
    onChange(next);
  };

  return (
    <div className="space-y-3 p-3 rounded-md bg-muted/50 border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Faixas de esforço
      </p>
      {EFFORT_LEVEL_ORDER.map((level) => {
        const tier = tierFor(tiers, level);
        return (
          <div
            key={level}
            className="grid grid-cols-[80px_1fr_1fr_80px] gap-2 items-end"
          >
            <div>
              <Label className="text-xs">{EFFORT_LEVEL_LABELS[level]}</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rótulo</Label>
              <Input
                value={tier.label}
                onChange={(e) => updateTier(level, { label: e.target.value })}
                placeholder="ex: Pequeno"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Exemplo</Label>
              <Input
                value={tier.example}
                onChange={(e) => updateTier(level, { example: e.target.value })}
                placeholder="ex: revisar um PR"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">XP</Label>
              <Input
                type="number"
                min={0}
                value={tier.xp}
                onChange={(e) =>
                  updateTier(level, { xp: Number(e.target.value) })
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
