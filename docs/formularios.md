# Formulários

Usamos [React Hook Form](https://react-hook-form.com/) com validação via [Yup](https://github.com/jquense/yup). Todos os inputs reutilizáveis ficam em `src/components/form/`.

---

## Padrão de um Formulário

Todo formulário segue esta estrutura:

```tsx
"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormTextInput from "@/components/form/text-input/form-text-input";
import { Button } from "@/components/ui/button";

type MeuFormData = {
  titulo: string;
  descricao: string;
};

const schema = yup.object().shape({
  titulo: yup.string().required("Título é obrigatório"),
  descricao: yup.string().required("Descrição é obrigatória"),
});

function BotaoSubmit() {
  const { isSubmitting } = useFormState();
  return (
    <Button type="submit" disabled={isSubmitting}>
      Enviar
    </Button>
  );
}

function MeuFormulario() {
  const methods = useForm<MeuFormData>({
    resolver: yupResolver(schema),
    defaultValues: { titulo: "", descricao: "" },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    // chamada de API aqui
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <FormTextInput<MeuFormData> name="titulo" label="Título" />
        <FormTextInput<MeuFormData> name="descricao" label="Descrição" />
        <BotaoSubmit />
      </form>
    </FormProvider>
  );
}
```

---

## Componentes de Input Disponíveis

Todos ficam em `src/components/form/` ou `src/components/`:

| Componente | Uso |
|-----------|-----|
| `FormTextInput` | Campos de texto, e-mail, senha |
| `FormCheckboxInput` | Checkboxes (ex: aceite de termos) |
| `FormSelectInput` | Select/dropdown simples |
| `FormDatePickerInput` | Seletor de data |
| `FormFileInput` | Upload de arquivo único |
| `FormMultipleFileInput` | Upload de múltiplos arquivos |
| `MarkdownEditor` | Textarea com toggle Editar/Preview para campos em markdown |

---

## MarkdownEditor — Campos de Texto Rico

Para campos que aceitam markdown (descrição de atividades, submissões, missões), use `MarkdownEditor` em vez de `FormTextInput`. O componente oferece tabs Editar/Preview e mostra contador de caracteres.

### Com React Hook Form (`Controller`)

Para integrar o `MarkdownEditor` ao RHF, use `Controller` (o componente não é nativo do RHF):

```tsx
import { Controller } from "react-hook-form";
import MarkdownEditor from "@/components/markdown-editor";
import { sanitizeMarkdownInput } from "@/lib/sanitize-markdown";

// Dentro do formulário, com methods = useForm(...)
const { control, formState: { errors } } = methods;

<Controller
  name="description"
  control={control}
  render={({ field }) => (
    <MarkdownEditor
      label="Descrição"
      value={field.value ?? ""}
      onChange={(v) => field.onChange(sanitizeMarkdownInput(v, 2000))}
      rows={6}
      maxLength={2000}
      error={errors.description?.message}
    />
  )}
/>
```

### Controlado por estado local (fora do RHF)

Para formulários que gerenciam estado manualmente (ex: `submissions/new`):

```tsx
import MarkdownEditor from "@/components/markdown-editor";
import { sanitizeMarkdownInput } from "@/lib/sanitize-markdown";

const [description, setDescription] = useState("");

<MarkdownEditor
  label={<span className="flex items-center gap-1.5">Descrição <span className="text-destructive">*</span></span>}
  value={description}
  onChange={(v) => setDescription(sanitizeMarkdownInput(v, 2000))}
  rows={5}
  maxLength={2000}
  error={descriptionError}
/>
```

### Props do `MarkdownEditor`

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `value` | `string` | Sim | Valor atual |
| `onChange` | `(value: string) => void` | Sim | Callback de mudança |
| `label` | `ReactNode` | Não | Label acima do editor (aceita JSX) |
| `placeholder` | `string` | Não | Placeholder do textarea |
| `rows` | `number` | Não | Altura inicial em linhas |
| `error` | `string` | Não | Mensagem de erro |
| `maxLength` | `number` | Não | Limite de caracteres (mostra contador) |

---

## Sanitização de Entrada Markdown

Use `sanitizeMarkdownInput` para campos onde usuários digitam conteúdo que será salvo como markdown. A função remove caracteres fora do conjunto seguro (emojis, CJK, Unicode especial, zero-width chars) e aplica o limite de caracteres.

```ts
// src/lib/sanitize-markdown.ts
export function sanitizeMarkdownInput(text: string, maxLength = 2000): string {
  return text
    .replace(/[^\t\n\r\x20-\x7E\u00A0-\u024F]/g, "") // mantém ASCII + Latin Extended
    .slice(0, maxLength);
}
```

Caracteres permitidos: tab, quebra de linha, ASCII imprimível (`\x20-\x7E`), Latin Extended (`\u00A0-\u024F`) — cobre acentuação do português e outros idiomas europeus.

**Sempre aplique antes de salvar no estado**, não só no submit:

```tsx
onChange={(v) => setDescription(sanitizeMarkdownInput(v, 2000))}
```

---

## Renderizando Markdown (Leitura)

Para exibir conteúdo markdown salvo, use `MarkdownContent`:

```tsx
import MarkdownContent from "@/components/markdown-content";

<MarkdownContent content={activity.description} className="text-sm" />
```

Para previews compactos (ex: listagem de cards), remova os tokens markdown antes de exibir:

```tsx
{activity.description.replace(/[#*`_>~\[\]]/g, "").trim()}
```

---

## Regra: Não Acoplar o Formulário ao Formato da API

A API pode retornar dados em formato diferente do que o formulário usa. **Sempre use funções de transformação** para converter entre os dois mundos:

```tsx
const transformIn = (data) => ({
  title: data.title,
  description: data.description ?? "",
  fixedReward: data.fixedReward,
});

const transformOut = (data) => ({
  title: data.title,
  description: data.description || null,
  fixedReward: Number(data.fixedReward),
});

// Para pré-preencher o formulário ao editar:
useEffect(() => {
  reset(transformIn(dadosApi));
}, [dadosApi]);

// No submit:
const onSubmit = handleSubmit((data) => {
  fetchApi(transformOut(data));
});
```

---

## Regra: Use `reset` para Pré-preencher Formulários de Edição

**Certo:**
```tsx
useEffect(() => {
  reset(transformIn(dadosExistentes));
}, [dadosExistentes]);
```

**Errado:**
```tsx
// NÃO use setValue para preencher múltiplos campos
// Isso quebra isDirty e outros estados do formulário
setValue("titulo", dadosExistentes.titulo);
setValue("descricao", dadosExistentes.descricao);
```

---

## Exibindo Erros da API no Formulário

Quando a API retorna erros de validação (HTTP 422), mapeie-os para os campos:

```tsx
const onSubmit = handleSubmit(async (formData) => {
  const { data, status } = await fetchSubmissao(formData);

  if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
    (Object.keys(data.errors) as Array<keyof MeuFormData>).forEach((key) => {
      setError(key, {
        type: "manual",
        message: t(`meu-namespace:inputs.${key}.validation.server.${data.errors[key]}`),
      });
    });
    return;
  }
});
```

---

Anterior: [API do Backend](api.md) | Próximo: [Como Contribuir](como-contribuir.md)
