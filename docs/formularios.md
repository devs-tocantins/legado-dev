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
import Button from "@mui/material/Button";

// 1. Tipo dos dados do formulário
type MeuFormData = {
  titulo: string;
  descricao: string;
};

// 2. Schema de validação
const schema = yup.object().shape({
  titulo: yup.string().required("Título é obrigatório"),
  descricao: yup.string().required("Descrição é obrigatória"),
});

// 3. Botão de submit separado (lê isSubmitting do contexto)
function BotaoSubmit() {
  const { isSubmitting } = useFormState();
  return (
    <Button type="submit" variant="contained" disabled={isSubmitting}>
      Enviar
    </Button>
  );
}

// 4. Componente principal do formulário
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

Todos ficam em `src/components/form/`:

| Componente | Uso |
|-----------|-----|
| `FormTextInput` | Campos de texto, e-mail, senha |
| `FormCheckboxInput` | Checkboxes (ex: aceite de termos) |
| `FormSelectInput` | Select/dropdown simples |
| `FormDatePickerInput` | Seletor de data |
| `FormFileInput` | Upload de arquivo único |
| `FormMultipleFileInput` | Upload de múltiplos arquivos |

---

## Regra: Não Acoplar o Formulário ao Formato da API

A API pode retornar dados em formato diferente do que o formulário usa. **Sempre use funções de transformação** para converter entre os dois mundos:

```tsx
// Dados que vêm da API
const dadosApi = { first_name: "João", role_id: 2 };

// Transforma para o formato do formulário
const transformIn = (data) => ({
  firstName: data.first_name,
  role: { id: data.role_id },
});

// Transforma de volta para enviar à API
const transformOut = (data) => ({
  first_name: data.firstName,
  role_id: data.role.id,
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
