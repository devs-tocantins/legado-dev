# Arquitetura

## Estrutura de Pastas

```
src/
├── app/
│   └── [language]/                  ← Todas as páginas da aplicação (rotas)
│       ├── page.tsx                 ← Home pública (título + botão Entrar)
│       ├── layout.tsx               ← Layout raiz (providers, navbar)
│       ├── sign-in/                 ← Login (e-mail/senha + Google)
│       ├── sign-up/                 ← Cadastro
│       ├── forgot-password/         ← Recuperação de senha
│       ├── password-change/         ← Redefinição de senha (via link do e-mail)
│       ├── confirm-email/           ← Confirmação de e-mail pós-cadastro
│       ├── profile/                 ← Perfil público de qualquer membro
│       ├── activities/              ← Catálogo de atividades
│       ├── submissions/
│       │   └── new/                 ← Envio de comprovante de atividade
│       ├── missions/
│       │   └── [id]/                ← Detalhe + submissão de missão
│       ├── rankings/                ← Rankings mensal, anual e global
│       ├── moderation/              ← Fila de moderação (ADMIN/MODERADOR)
│       └── admin-panel/             ← Painel administrativo (ADMIN)
│           ├── page.tsx             ← Dashboard com métricas e saúde dos serviços
│           ├── activities/          ← CRUD de atividades
│           ├── submissions/         ← Gestão de submissões
│           ├── gamification-profiles/ ← Gestão de perfis + penalidades
│           ├── missions/            ← CRUD de missões
│           ├── badges/              ← CRUD de badges + concessão manual
│           ├── transactions/        ← Histórico de transações
│           └── users/               ← Gestão de contas de usuários
│
├── components/               ← Componentes reutilizáveis
│   ├── app-bar/              ← Barra de navegação
│   ├── confirm-dialog/       ← Dialog de confirmação genérico
│   ├── form/                 ← Inputs reutilizáveis (text, checkbox, file...)
│   ├── table/                ← Componentes de tabela (react-virtuoso)
│   ├── link/                 ← Wrapper de Link com i18n
│   ├── markdown-editor.tsx   ← Editor markdown com toggle Editar/Preview
│   └── markdown-content.tsx  ← Renderizador de markdown (react-markdown)
│
├── lib/
│   └── sanitize-markdown.ts  ← Sanitiza entrada de texto markdown (remove emojis/Unicode especial)
│
└── services/                 ← Serviços e utilitários
    ├── api/                  ← Chamadas HTTP (useFetch + React Query)
    │   ├── services/         ← Um arquivo por recurso da API (auth, users...)
    │   └── types/            ← Tipos TypeScript dos recursos
    ├── auth/                 ← Lógica de autenticação (tokens, guards)
    ├── i18n/                 ← Configuração de internacionalização
    │   └── locales/
    │       ├── en/           ← Traduções em inglês
    │       └── pt-BR/        ← Traduções em português
    ├── react-query/          ← Configuração do TanStack Query
    └── social-auth/
        └── google/           ← Integração com Google OAuth
```

---

## Como as Páginas Funcionam

Cada rota segue o padrão **dois arquivos**:

```
minha-pagina/
├── page.tsx          ← Server Component (metadata, gera parâmetros estáticos)
└── page-content.tsx  ← Client Component (lógica, formulários, estado)
```

**`page.tsx`** é um Server Component. Ele define o `<title>` da aba usando `generateMetadata` e renderiza o `page-content.tsx`.

**`page-content.tsx`** tem `"use client"` no topo. É onde fica toda a lógica React (hooks, formulários, chamadas de API).

### Exemplo — Criando uma nova página protegida

1. Crie a pasta em `src/app/[language]/minha-pagina/`
2. Crie o `page.tsx`:

```tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import MinhaPaginaContent from "./page-content";

type Props = { params: Promise<{ language: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "minha-pagina");
  return { title: t("title") };
}

export default function Page() {
  return <MinhaPaginaContent />;
}
```

3. Crie o `page-content.tsx`:

```tsx
"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";

function MinhaPaginaContent() {
  const { t } = useTranslation("minha-pagina");
  return <h1>{t("title")}</h1>;
}

export default withPageRequiredAuth(MinhaPaginaContent);
```

4. Crie os arquivos de tradução:
   - `src/services/i18n/locales/pt-BR/minha-pagina.json`
   - `src/services/i18n/locales/en/minha-pagina.json`

---

## Proteção de Rotas

O projeto tem dois guards de página:

| HOC | Comportamento |
|-----|--------------|
| `withPageRequiredAuth` | Exige usuário logado. Redireciona para `/sign-in` se não estiver. |
| `withPageRequiredGuest` | Apenas para visitantes. Redireciona para `/` se já estiver logado. |
| `withPageRequiredAuth({ roles: [RoleEnum.ADMIN] })` | Exige papel específico (ADMIN, MODERATOR). |

Use assim no final do `page-content.tsx`:

```tsx
// Usuário logado qualquer:
export default withPageRequiredAuth(MinhaPage);

// Apenas admins:
export default withPageRequiredAuth(MinhaPage, { roles: [RoleEnum.ADMIN] });

// Apenas visitantes (sign-in, sign-up):
export default withPageRequiredGuest(MinhaPage);
```

---

## Internacionalização (i18n)

O projeto suporta **pt-BR** (padrão) e **en**. O idioma faz parte da URL: `/pt-BR/dashboard`, `/en/dashboard`.

**Como usar traduções em um Client Component:**

```tsx
import { useTranslation } from "@/services/i18n/client";

function MeuComponente() {
  const { t } = useTranslation("nome-do-namespace");
  return <p>{t("chave")}</p>;
}
```

**Como usar em um Server Component:**

```tsx
import { getServerTranslation } from "@/services/i18n";

const { t } = await getServerTranslation(language, "nome-do-namespace");
```

Cada página tem seu próprio namespace JSON. Exemplo — `src/services/i18n/locales/pt-BR/dashboard.json`:

```json
{
  "title": "Painel"
}
```

> Sempre que criar um namespace novo, crie o arquivo correspondente em **ambos** os locales (`pt-BR/` e `en/`).

---

## Chamadas de API

As chamadas seguem o padrão React Query + `useFetch`. Cada recurso tem seu arquivo em `src/services/api/services/`.

**Exemplo — criando um hook de consulta:**

```tsx
// src/services/api/services/gamification.ts
import { useQuery } from "@tanstack/react-query";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";

export function useMyGamificationProfileQuery() {
  const fetchBase = useFetch();

  return useQuery({
    queryKey: ["gamification-profile", "me"],
    queryFn: () =>
      fetchBase(`${API_URL}/v1/gamification-profiles/me`).then(
        wrapperFetchJsonResponse
      ),
  });
}
```

---

## Sistema de Gamificação

A gamificação é o core da plataforma. Para documentação completa das regras de negócio (níveis, XP, badges, missões, rankings, crons), veja [gamificacao.md](gamificacao.md).

### Componentes de renderização markdown

Dois componentes compartilhados para lidar com conteúdo markdown:

**`MarkdownEditor`** (`src/components/markdown-editor.tsx`) — campo de edição com tabs Editar/Preview. Usado em todos os formulários que aceitam markdown (descrição de atividades, submissões, missões). Aceita `ReactNode` como `label` para badges/ícones ao lado.

**`MarkdownContent`** (`src/components/markdown-content.tsx`) — renderizador read-only usando `react-markdown`. Usado para exibir descriptions de atividades, submissões e missões ao usuário.

### Sanitização de entrada

`src/lib/sanitize-markdown.ts` — remove caracteres fora do conjunto seguro (emojis, CJK, Unicode especial) e aplica limite de caracteres. Sempre aplique antes de salvar no estado em campos markdown de entrada do usuário.

---

Anterior: [Instalação](instalacao.md) | Próximo: [Autenticação](autenticacao.md)
