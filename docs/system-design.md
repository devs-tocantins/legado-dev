# legado.dev — Documento de Design do Sistema

**Versão:** 1.0 — Abril 2026  
**Público:** Equipe técnica / Aprovação arquitetural

---

## 1. Visão Geral

O **legado.dev** é uma plataforma de engajamento gamificado para comunidades de desenvolvedores. O objetivo central é motivar participação através de recompensas em XP (pontos de experiência), rankings, badges e missões competitivas.

O sistema é composto por dois serviços independentes:

| Camada | Tecnologia | Hospedagem |
|--------|-----------|------------|
| Frontend (SPA/SSR) | Next.js 14 (App Router) + Tailwind CSS | Vercel (auto-deploy via GitHub) |
| Backend (API REST) | NestJS + TypeORM + PostgreSQL | Oracle Cloud VM (Docker) |
| Banco de dados | PostgreSQL (Neon — serverless) | Neon.tech |
| Armazenamento de arquivos | Cloudflare R2 (S3-compatible) | Cloudflare |
| E-mail transacional | Brevo (SMTP) | Brevo |

---

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Usuário Final                        │
│                    (navegador / mobile)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (CDN + Edge)                      │
│              Next.js — SSR + Static Pages                   │
│  Rotas: /dashboard, /activities, /missions, /leaderboard,  │
│         /submissions, /u/:username, /admin-panel/*          │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API calls (JWT Bearer)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               NestJS API (Docker — Oracle VM)               │
│           https://136.248.75.34.nip.io/api/v1/*             │
│                                                             │
│  Módulos: auth, users, gamification-profiles, activities,  │
│           submissions, missions, badges, transactions,      │
│           notifications, files, contribution-reports        │
└────────┬───────────────────────────────────────┬────────────┘
         │ TypeORM                               │ S3 SDK
         ▼                                       ▼
┌─────────────────┐                   ┌──────────────────────┐
│   PostgreSQL    │                   │   Cloudflare R2      │
│   (Neon.tech)   │                   │  (upload de imagens) │
└─────────────────┘                   └──────────────────────┘
```

### Fluxo de autenticação

1. Usuário faz login com e-mail/senha ou OAuth (GitHub/Google)
2. API retorna JWT (access token) + refresh token
3. Frontend armazena o token e o envia em todas as requisições via `Authorization: Bearer <token>`
4. Rotas protegidas verificam o JWT via guard `AuthGuard('jwt')`

---

## 3. Papéis de Usuário (Roles)

| Role | ID | Descrição |
|------|----|-----------|
| `admin` | 1 | Acesso total. Invisível no ranking e perfis públicos. |
| `user` | 2 | Usuário padrão. Participa de atividades, missões, ranking. |
| `moderator` | 3 | Pode revisar submissões e ver dados internos, mas não editar configurações. |

**Regra de privacidade admin:** usuários com `role.id = 1` são completamente ocultos de qualquer endpoint público (ranking, busca por username, perfil por ID).

---

## 4. Módulos do Backend

### 4.1 Auth (`/api/v1/auth`)

- `POST /email/login` — login com e-mail e senha
- `POST /email/register` — cadastro
- `POST /refresh` — renovar access token
- `POST /logout` — invalidar sessão
- `GET /github`, `GET /google` — OAuth social

### 4.2 Users (`/api/v1/users`)

Gerenciamento de contas de usuário. Endpoints administrativos para criar, atualizar, banir e deletar usuários.

### 4.3 Gamification Profiles (`/api/v1/gamification-profiles`)

Cada usuário tem exatamente um perfil de gamificação. É o dado principal para o ranking.

**Campos principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `username` | string único | Identificador público do usuário |
| `totalXp` | int | XP acumulado total (para ranking geral) |
| `currentMonthlyXp` | int | XP do mês atual (para ranking mensal) |
| `currentYearlyXp` | int | XP do ano atual (para ranking anual) |
| `gratitudeTokens` | int | Tokens de gratidão (podem ser doados a outros) |
| `isBanned` | bool | Usuário banido fica oculto do ranking |

**Endpoints públicos:**
- `GET /` — ranking paginado (exclui admins e banidos)
- `GET /by-username/:username` — perfil público
- `GET /:id` — perfil por ID

**Endpoints autenticados:**
- `GET /me`, `PATCH /me` — perfil próprio
- `POST /transfer` — transferir tokens de gratidão

### 4.4 Activities (`/api/v1/activities`)

Atividades são tarefas recorrentes que qualquer usuário pode completar para ganhar XP fixo.

**Características:**
- `fixedReward` — XP concedido por aprovação
- `cooldownHours` — tempo de espera entre submissões do mesmo usuário
- `requiresProof` — se exige upload de arquivo
- `isHidden` — atividades secretas (não aparecem na listagem pública)

### 4.5 Submissions (`/api/v1/submissions`)

Submissões são respostas de usuários a atividades.

**Ciclo de vida:**

```
PENDING → APPROVED (XP creditado automaticamente)
        → REJECTED (feedback enviado, sem XP)
```

**Endpoints:**
- `POST /` — criar submissão (usuário autenticado)
- `GET /me` — minhas submissões
- `GET /pending` — fila de revisão (moderador/admin)
- `PATCH /:id/review` — aprovar ou rejeitar (moderador/admin)

### 4.6 Missions (`/api/v1/missions`)

Missões são desafios únicos onde **apenas um participante pode vencer**.

**Características:**
- Ao contrário das atividades, só um usuário recebe o XP
- Quando uma submissão é aprovada, a missão é encerrada (`CLOSED`) e nenhuma nova submissão é aceita
- `isSecret` — missão oculta da listagem pública
- `requiresProof`, `requiresDescription` — obrigatoriedade de evidências

**Endpoints públicos:**
- `GET /` — listar missões abertas (paginado, com busca)
- `GET /:id` — detalhes da missão
- `GET /:id/participants` — participantes (apenas username + status, sem conteúdo das submissões)

**Endpoints autenticados (usuário):**
- `POST /:id/submit` — enviar participação
- `GET /:id/my-submission` — ver minha submissão

**Endpoints admin/moderador:**
- `GET /admin/all` — todas as missões
- `GET /:id/submissions` — submissões completas (com conteúdo)
- `PATCH /:id/submissions/:submissionId/review` — revisar

### 4.7 Badges (`/api/v1/badges`)

Conquistas automáticas concedidas com base em regras avaliadas após cada transação de XP. Exemplos: "Primeiro XP", "100 XP acumulados", "Top 3 do mês".

O `BadgeEvaluatorService` roda assincronamente após eventos de crédito de XP.

Um cron job semanal (`RankingCronService`) atribui badges de ranking com base nas posições atuais.

### 4.8 Transactions (`/api/v1/transactions`)

Histórico completo de movimentações de XP do usuário. Categorias:

| Categoria | Descrição |
|-----------|-----------|
| `ACTIVITY_REWARD` | XP por atividade aprovada |
| `MISSION_REWARD` | XP por missão vencida |
| `TOKEN_TRANSFER` | Saída de tokens de gratidão |
| `TOKEN_REWARD` | Recebimento de tokens de gratidão |
| `PENALTY` | Penalidade aplicada por admin |

### 4.9 Files (`/api/v1/files`)

- `POST /upload` — upload de imagem (JPG, PNG, GIF, WebP, máx. 5 MB)
- Armazenamento direto no Cloudflare R2 via `multer-s3`
- Retorna `{ file: { path: "chave-do-arquivo" } }`

### 4.10 Notifications (`/api/v1/notifications`)

Sistema de notificações internas (in-app). Geradas automaticamente em eventos como aprovação de submissão, recebimento de tokens, conquista de badge.

---

## 5. Módulos do Frontend

### 5.1 Páginas públicas

| Rota | Descrição |
|------|-----------|
| `/leaderboard` | Ranking de XP (geral, mensal, anual) |
| `/activities` | Catálogo de atividades (card/lista) |
| `/missions` | Missões abertas e encerradas (card/lista) |
| `/missions/:id` | Detalhe da missão + participantes + formulário de participação |
| `/u/:username` | Perfil público do usuário |

### 5.2 Páginas autenticadas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Resumo pessoal (XP, badges, submissões recentes) |
| `/submissions` | Histórico de submissões do usuário |
| `/submissions/new` | Criar nova submissão para uma atividade |
| `/transactions` | Histórico de transações de XP |
| `/profile/edit` | Editar username, GitHub, avatar |

### 5.3 Painel administrativo (`/admin-panel`)

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/admin-panel/users` | Admin | Gerenciar usuários |
| `/admin-panel/activities` | Admin | CRUD de atividades |
| `/admin-panel/missions` | Admin/Mod | CRUD de missões + revisão de submissões |
| `/admin-panel/submissions` | Admin/Mod | Fila de revisão de submissões |
| `/admin-panel/badges` | Admin | CRUD de badges |
| `/admin-panel/transactions` | Admin | Histórico global de transações |
| `/admin-panel/gamification-profiles` | Admin | Gerenciar perfis |

### 5.4 Moderação (`/moderation`)

Interface unificada para moderadores revisarem submissões pendentes com filtros por atividade e missão.

---

## 6. Fluxos Principais

### Fluxo: Usuário completa uma atividade

```
1. Usuário acessa /activities
2. Clica em "Submeter" → vai para /submissions/new?activityId=X
3. Preenche formulário (descrição + arquivo opcional)
4. Se há arquivo: POST /files/upload → recebe path do arquivo no R2
5. POST /submissions com { activityId, description, proofUrl }
6. Submissão criada com status PENDING
7. Moderador acessa /admin-panel/submissions ou /moderation
8. PATCH /submissions/:id/review com { status: "APPROVED" }
9. XP creditado automaticamente no GamificationProfile
10. Notificação enviada ao usuário
11. BadgeEvaluatorService roda → verifica se novas conquistas foram desbloqueadas
```

### Fluxo: Usuário participa de uma missão

```
1. Usuário acessa /missions → vê missões OPEN
2. Clica em "Participar" → vai para /missions/:id
3. Vê detalhes, requisitos e lista de participantes existentes
4. Preenche formulário de participação (arquivo + descrição)
5. POST /missions/:id/submit
6. Admin/Mod revisa em /admin-panel/missions
7. Se APPROVED: missão encerrada (CLOSED), XP concedido, notificação enviada
8. Se REJECTED: missão continua aberta para outros participantes
```

### Fluxo: Tokens de Gratidão

```
1. Todo mês, tokens são resetados e distribuídos a todos os perfis
   (cron job em GamificationProfilesCronService)
2. Usuário acessa /dashboard → vê saldo de tokens
3. POST /gamification-profiles/transfer com { recipientProfileId, amount, message }
4. Tokens debitados do remetente, XP creditado no destinatário
5. Transações registradas para ambos os lados
```

---

## 7. Segurança

- **JWT:** tokens de acesso com expiração curta + refresh token de longa duração
- **Guards:** `AuthGuard('jwt')` + `RolesGuard` em todos os endpoints sensíveis
- **Admins ocultos:** role `admin` (ID=1) não aparece em nenhum endpoint público
- **Anti-cooldown:** o backend impede submissão duplicada dentro do período de cooldown da atividade
- **Anti-self-review:** moderador não pode revisar sua própria submissão de missão
- **Validação de entrada:** DTOs com `class-validator` em todas as rotas (body + query params)
- **Upload seguro:** apenas imagens permitidas (JPG/PNG/GIF/WebP), limite de 5 MB, nome aleatorizado no R2

---

## 8. Infraestrutura de Produção

```
Domínio API:   https://136.248.75.34.nip.io
Domínio Front: https://legado.devs-tocantins.com.br (Vercel)

Oracle VM:
  - Ubuntu + Docker + Nginx (TLS via nip.io)
  - docker-compose.prod.yaml (serviço: api-legado-dev)

Deploy API:
  1. Build local AMD64 image (Docker Buildx)
  2. Compactar com gzip
  3. rsync para a VM
  4. docker load + docker compose down/up

Deploy Frontend:
  - Push para main no GitHub → Vercel auto-deploy
```

---

## 9. Decisões de Design Notáveis

**Por que atividades e missões são conceitos separados?**  
Atividades são recorrentes e qualquer um pode ganhar XP nelas. Missões são competitivas — cria urgência e exclusividade, incentivando participação rápida e de qualidade.

**Por que XP e Tokens de Gratidão coexistem?**  
XP é ganho individualmente por mérito. Tokens de Gratidão são distribuídos igualmente a todos e só podem ser doados a outros — criam uma economia de reconhecimento social desvinculada da performance.

**Por que submissions de missão não expõem conteúdo publicamente?**  
Para evitar que participantes tardios copiem as soluções dos anteriores. A lista de participantes é pública (username + status), mas descrição e arquivo são restritos a admins/moderadores.

**Por que admins são invisíveis?**  
Para manter a imparcialidade percebida do ranking e evitar que a conta administrativa influencie resultados ou apareça em buscas de usuário.
