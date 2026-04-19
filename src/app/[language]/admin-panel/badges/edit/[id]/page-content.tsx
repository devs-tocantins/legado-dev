"use client";

import {
  useForm,
  FormProvider,
  useFormState,
  Controller,
  useWatch,
} from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect, useState } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  usePatchBadgeService,
  useGetAllBadgesService,
  useGrantBadgeService,
  BadgeCategoryEnum,
} from "@/services/api/services/badges";
import { useGetGamificationProfileByUsernameService } from "@/services/api/services/gamification-profiles";
import { useParams } from "next/navigation";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { badgesQueryKeys } from "../../queries/queries";
import { Info } from "lucide-react";
import { RoleEnum } from "@/services/api/types/role";
import { ChevronLeft } from "lucide-react";

type EditFormData = {
  name: string;
  description: string;
  imageUrl: string;
  category: BadgeCategoryEnum;
  isActive: boolean;
  milestoneType: string;
  milestoneThreshold: number;
  rankingPeriod: string;
  rankingPosition: number;
  rankingMonth: number;
  rankingYear: number;
  membershipMonths: number;
};

const CATEGORY_LABELS: Record<BadgeCategoryEnum, string> = {
  MILESTONE: "Marco (Milestone)",
  RANKING: "Ranking",
  PARTICIPATION: "Participação",
  SPECIAL: "Especial / Manual",
};

const useValidationSchema = () =>
  yup.object().shape({
    name: yup.string().required("Nome é obrigatório"),
    description: yup.string().default(""),
    imageUrl: yup.string().url("URL inválida").default(""),
    category: yup
      .mixed<BadgeCategoryEnum>()
      .oneOf(["MILESTONE", "RANKING", "PARTICIPATION", "SPECIAL"])
      .default("SPECIAL"),
    isActive: yup.boolean().default(true),
    milestoneType: yup.string().default("submissions_approved"),
    milestoneThreshold: yup.number().min(1).default(1),
    rankingPeriod: yup.string().default("monthly_ranking"),
    rankingPosition: yup.number().min(1).max(3).default(1),
    rankingMonth: yup
      .number()
      .min(1)
      .max(12)
      .default(new Date().getMonth() + 1),
    rankingYear: yup.number().min(2025).default(new Date().getFullYear()),
    membershipMonths: yup.number().min(1).default(3),
  });

function EditBadgeFormActions() {
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      Salvar alterações
    </Button>
  );
}

function CriteriaFields({ category }: { category: BadgeCategoryEnum }) {
  if (category === "MILESTONE") {
    return (
      <div className="space-y-3 p-3 rounded-md bg-muted/50 border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Critério
        </p>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Controller
            name="milestoneType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submissions_approved">
                    Submissões aprovadas
                  </SelectItem>
                  <SelectItem value="total_xp">XP Total acumulado</SelectItem>
                  <SelectItem value="tokens_sent">Tokens enviados</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Quantidade mínima</Label>
          <Controller
            name="milestoneThreshold"
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </div>
      </div>
    );
  }

  if (category === "RANKING") {
    const MONTHS = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return (
      <div className="space-y-3 p-3 rounded-md bg-muted/50 border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Critério
        </p>
        <div className="space-y-1.5">
          <Label>Período</Label>
          <Controller
            name="rankingPeriod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_ranking">
                    Ranking Mensal
                  </SelectItem>
                  <SelectItem value="annual_ranking">Ranking Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <Controller
          name="rankingPeriod"
          render={({ field: periodField }) =>
            periodField.value === "monthly_ranking" ? (
              <div className="space-y-1.5">
                <Label>Mês</Label>
                <Controller
                  name="rankingMonth"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : (
              <></>
            )
          }
        />
        <div className="space-y-1.5">
          <Label>Ano</Label>
          <Controller
            name="rankingYear"
            render={({ field }) => (
              <Input
                type="number"
                min={2025}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Posição no ranking</Label>
          <Controller
            name="rankingPosition"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">🥇 1º lugar</SelectItem>
                  <SelectItem value="2">🥈 2º lugar</SelectItem>
                  <SelectItem value="3">🥉 3º lugar</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    );
  }

  if (category === "PARTICIPATION") {
    return (
      <div className="space-y-3 p-3 rounded-md bg-muted/50 border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Critério
        </p>
        <div className="space-y-1.5">
          <Label>Meses de participação</Label>
          <Controller
            name="membershipMonths"
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        Badge especial — conceda manualmente abaixo buscando pelo username.
      </span>
    </div>
  );
}

function GrantBadgeSection({ badgeId }: { badgeId: string }) {
  const { enqueueSnackbar } = useSnackbar();
  const fetchGrant = useGrantBadgeService();
  const fetchByUsername = useGetGamificationProfileByUsernameService();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { status: profileStatus, data: profile } = await fetchByUsername(
        username.trim()
      );
      if (profileStatus !== HTTP_CODES_ENUM.OK || !profile) {
        enqueueSnackbar("Usuário não encontrado", { variant: "error" });
        return;
      }
      const { status } = await fetchGrant({
        badgeId,
        profileId: profile.id,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(`Badge concedido a @${username}`, {
          variant: "success",
        });
        setUsername("");
      } else {
        enqueueSnackbar("Erro ao conceder badge", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conceder badge manualmente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Username do usuário</Label>
          <div className="flex gap-2">
            <Input
              placeholder="ex: joao_silva"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleGrant();
                }
              }}
            />
            <Button
              onClick={handleGrant}
              disabled={loading || !username.trim()}
            >
              {loading ? "Concedendo..." : "Conceder"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function parseCriteriaConfig(
  config: Record<string, unknown> | null | undefined,
  category: BadgeCategoryEnum
) {
  if (!config) return {};
  if (category === "MILESTONE") {
    return {
      milestoneType: (config.type as string) ?? "submissions_approved",
      milestoneThreshold: Number(config.threshold ?? 1),
    };
  }
  if (category === "RANKING") {
    return {
      rankingPeriod: (config.type as string) ?? "monthly_ranking",
      rankingPosition: Number(config.position ?? 1),
      rankingMonth: Number(config.month ?? new Date().getMonth() + 1),
      rankingYear: Number(config.year ?? new Date().getFullYear()),
    };
  }
  if (category === "PARTICIPATION") {
    return { membershipMonths: Number(config.threshold ?? 3) };
  }
  return {};
}

function buildCriteriaConfig(data: EditFormData) {
  if (data.category === "MILESTONE") {
    return { type: data.milestoneType, threshold: data.milestoneThreshold };
  }
  if (data.category === "RANKING") {
    return data.rankingPeriod === "monthly_ranking"
      ? {
          type: data.rankingPeriod,
          position: data.rankingPosition,
          month: data.rankingMonth,
          year: data.rankingYear,
        }
      : {
          type: data.rankingPeriod,
          position: data.rankingPosition,
          year: data.rankingYear,
        };
  }
  if (data.category === "PARTICIPATION") {
    return { type: "membership_months", threshold: data.membershipMonths };
  }
  return undefined;
}

function FormEditBadge() {
  const params = useParams<{ id: string }>();
  const badgeId = params.id;
  const fetchGetAll = useGetAllBadgesService();
  const fetchPatch = usePatchBadgeService();
  const { enqueueSnackbar } = useSnackbar();
  const validationSchema = useValidationSchema();
  const queryClient = useQueryClient();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      category: "SPECIAL",
      isActive: true,
      milestoneType: "submissions_approved",
      milestoneThreshold: 1,
      rankingPeriod: "monthly_ranking",
      rankingPosition: 1,
      rankingMonth: new Date().getMonth() + 1,
      rankingYear: new Date().getFullYear(),
      membershipMonths: 3,
    },
  });

  const { handleSubmit, setError, reset, control } = methods;
  const category = useWatch({ control, name: "category" });

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatch(badgeId, {
      name: formData.name,
      description: formData.description,
      imageUrl: formData.imageUrl || undefined,
      category: formData.category,
      criteriaType: formData.category === "SPECIAL" ? "MANUAL" : "AUTOMATIC",
      criteriaConfig: buildCriteriaConfig(formData),
      isActive: formData.isActive,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys((data as any).errors) as Array<keyof EditFormData>).forEach(
        (key) => {
          setError(key, { type: "manual", message: (data as any).errors[key] });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      await queryClient.invalidateQueries({
        queryKey: badgesQueryKeys.list().key,
      });
      enqueueSnackbar("Badge atualizado com sucesso", { variant: "success" });
    }
  });

  useEffect(() => {
    const load = async () => {
      const { status, data } = await fetchGetAll();
      if (status === HTTP_CODES_ENUM.OK) {
        const badge = data.find((b) => b.id === badgeId);
        if (badge) {
          const criteriaFields = parseCriteriaConfig(
            badge.criteriaConfig,
            badge.category
          );
          reset({
            name: badge.name,
            description: badge.description ?? "",
            imageUrl: badge.imageUrl ?? "",
            category: badge.category,
            isActive: badge.isActive,
            milestoneType: "submissions_approved",
            milestoneThreshold: 1,
            rankingPeriod: "monthly_ranking",
            rankingPosition: 1,
            membershipMonths: 3,
            ...criteriaFields,
          });
        }
      }
    };
    load();
  }, [badgeId, reset, fetchGetAll]);

  return (
    <div className="mx-auto max-w-lg p-6 space-y-6">
      <FormProvider {...methods}>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2"
            render={<Link href="/admin-panel/badges" />}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Editar Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<EditFormData>
                name="name"
                testId="name"
                label="Nome"
              />
              <FormTextInput<EditFormData>
                name="description"
                testId="description"
                label="Descrição"
                multiline
                minRows={2}
              />
              <FormTextInput<EditFormData>
                name="imageUrl"
                testId="imageUrl"
                label="URL da imagem (opcional)"
              />

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(CATEGORY_LABELS) as BadgeCategoryEnum[]
                        ).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <CriteriaFields category={category as BadgeCategoryEnum} />

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <EditBadgeFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/badges" />}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      <GrantBadgeSection badgeId={badgeId} />
    </div>
  );
}

function EditBadge() {
  return <FormEditBadge />;
}

export default withPageRequiredAuth(EditBadge, { roles: [RoleEnum.ADMIN] });
