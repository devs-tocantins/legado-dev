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
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  usePostBadgeService,
  BadgeCategoryEnum,
} from "@/services/api/services/badges";
import { useRouter } from "next/navigation";
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
import { Info } from "lucide-react";
import { RoleEnum } from "@/services/api/types/role";
import { ChevronLeft } from "lucide-react";

type CreateFormData = {
  name: string;
  description: string;
  imageUrl: string;
  category: BadgeCategoryEnum;
  // MILESTONE
  milestoneType: string;
  milestoneThreshold: number;
  // RANKING
  rankingPeriod: string;
  rankingPosition: number;
  rankingMonth: number;
  rankingYear: number;
  // PARTICIPATION
  membershipMonths: number;
};

const CATEGORY_LABELS: Record<BadgeCategoryEnum, string> = {
  MILESTONE: "Marco (Milestone)",
  RANKING: "Ranking",
  PARTICIPATION: "Participação",
  SPECIAL: "Especial / Manual",
};

const CATEGORY_DESCRIPTIONS: Record<BadgeCategoryEnum, string> = {
  MILESTONE:
    "Concedido automaticamente quando o usuário atinge um marco (ex: 10 submissões aprovadas, 500 XP).",
  RANKING:
    "Concedido automaticamente pelo cron ao final do mês ou ano para os melhores colocados.",
  PARTICIPATION:
    "Concedido automaticamente após X meses de participação na plataforma.",
  SPECIAL:
    "Concedido manualmente pelo admin para reconhecer feitos excepcionais.",
};

const useValidationSchema = () =>
  yup.object().shape({
    name: yup.string().required("Nome é obrigatório"),
    description: yup.string().default(""),
    imageUrl: yup.string().url("URL inválida").default(""),
    category: yup
      .mixed<BadgeCategoryEnum>()
      .oneOf(["MILESTONE", "RANKING", "PARTICIPATION", "SPECIAL"])
      .default("MILESTONE"),
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

function CreateBadgeFormActions() {
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      Salvar
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
        Badge especial — concedido manualmente pelo admin na página de edição.
      </span>
    </div>
  );
}

function FormCreateBadge() {
  const router = useRouter();
  const fetchPost = usePostBadgeService();
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      category: "MILESTONE",
      milestoneType: "submissions_approved",
      milestoneThreshold: 1,
      rankingPeriod: "monthly_ranking",
      rankingPosition: 1,
      rankingMonth: new Date().getMonth() + 1,
      rankingYear: new Date().getFullYear(),
      membershipMonths: 3,
    },
  });

  const { handleSubmit, setError, control } = methods;
  const category = useWatch({ control, name: "category" });

  const buildCriteriaConfig = (data: CreateFormData) => {
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
  };

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      name: formData.name,
      description: formData.description,
      imageUrl: formData.imageUrl || undefined,
      category: formData.category,
      criteriaType: formData.category === "SPECIAL" ? "MANUAL" : "AUTOMATIC",
      criteriaConfig: buildCriteriaConfig(formData),
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys((data as any).errors) as Array<keyof CreateFormData>
      ).forEach((key) =>
        setError(key, { type: "manual", message: (data as any).errors[key] })
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar("Badge criado com sucesso", { variant: "success" });
      router.push("/admin-panel/badges");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-lg p-6">
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
            <CardTitle>Criar Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<CreateFormData>
                name="name"
                testId="name"
                label="Nome"
              />
              <FormTextInput<CreateFormData>
                name="description"
                testId="description"
                label="Descrição"
                multiline
                minRows={2}
              />
              <FormTextInput<CreateFormData>
                name="imageUrl"
                testId="imageUrl"
                label="URL da imagem (opcional — pode adicionar depois)"
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
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_DESCRIPTIONS[category as BadgeCategoryEnum]}
                </p>
              </div>

              <CriteriaFields category={category as BadgeCategoryEnum} />

              <div className="flex gap-2 pt-2">
                <CreateBadgeFormActions />
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
      </div>
    </FormProvider>
  );
}

function CreateBadge() {
  return <FormCreateBadge />;
}

export default withPageRequiredAuth(CreateBadge, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
