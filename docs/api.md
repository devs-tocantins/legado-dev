# API do Backend

Todos os endpoints exigem o header `Authorization: Bearer <token>` exceto onde indicado como `[PÚBLICO]`.

URL base local: `http://localhost:3000/api/v1`

---

## Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/email/register` | Cadastro com e-mail e senha |
| `POST` | `/auth/email/login` | Login com e-mail e senha |
| `POST` | `/auth/google/login` | Login com token do Google |
| `POST` | `/auth/refresh` | Renova o JWT usando o refreshToken |
| `DELETE` | `/auth/logout` | Encerra a sessão |
| `POST` | `/auth/forgot/password` | Envia e-mail de recuperação de senha |
| `POST` | `/auth/reset/password` | Redefine a senha via token do e-mail |

---

## Perfil do Usuário

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/auth/me` | Dados do usuário logado |
| `PATCH` | `/auth/me` | Atualiza nome, foto do perfil |
| `PATCH` | `/auth/change/password` | Altera a senha |
| `PATCH` | `/auth/change/email` | Solicita alteração de e-mail |
| `DELETE` | `/auth/me` | Remove a própria conta |

---

## Perfil de Gamificação

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/gamification-profiles/me` | Meu XP (mensal, anual, total), level e tokens de gratidão |
| `PATCH` | `/gamification-profiles/me` | Atualiza username, githubUsername, bannerPreset |
| `GET` | `/gamification-profiles/check-username/:username` | `[PÚBLICO]` Verifica disponibilidade de username (`{ available: boolean }`) |
| `GET` | `/gamification-profiles/by-username/:username` | `[PÚBLICO]` Perfil público por @handle |
| `GET` | `/gamification-profiles/:id` | `[PÚBLICO]` Perfil público por ID |
| `GET` | `/gamification-profiles/:id/approved-submissions` | `[PÚBLICO]` Submissões aprovadas de um perfil (paginado) |
| `POST` | `/gamification-profiles/transfer` | Transfere tokens de gratidão para outro membro |
| `GET` | `/gamification-profiles` | `[ADMIN]` Lista todos os perfis (paginado, filtrado, ordenado) |
| `POST` | `/gamification-profiles` | `[ADMIN]` Cria perfil manualmente |
| `PATCH` | `/gamification-profiles/:id` | `[ADMIN]` Edita perfil de gamificação |
| `POST` | `/gamification-profiles/:id/penalty` | `[ADMIN]` Aplica penalidade (deduz XP) |
| `DELETE` | `/gamification-profiles/:id` | `[ADMIN]` Remove perfil |

**Body de `POST /gamification-profiles/transfer`:**
```json
{
  "toUsername": "handle-do-destinatario",
  "amount": 2,
  "feedbackMessage": "Valeu pela ajuda com o TypeScript!"
}
```

**Body de `POST /gamification-profiles/:id/penalty`:**
```json
{
  "amount": 50,
  "reason": "Fraude em submissão de evidências"
}
```

**Resposta de `/gamification-profiles/me`:**
```json
{
  "id": "uuid",
  "username": "handle",
  "githubUsername": "gh-user",
  "bannerPreset": "default",
  "totalXp": 1500,
  "currentMonthlyXp": 200,
  "currentYearlyXp": 800,
  "gratitudeTokens": 5,
  "currentLevel": "Contribuidor"
}
```
> Nota: `gratitudeTokens` são renovados diariamente para o valor padrão (ex: 5).

---

## Catálogo de Atividades

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/activities` | `[PÚBLICO]` Lista atividades visíveis (paginado) |
| `GET` | `/activities/:id` | `[PÚBLICO]` Detalhe de uma atividade |
| `GET` | `/activities/all` | `[ADMIN/MODERADOR]` Lista todas, incluindo ocultas (paginado) |
| `POST` | `/activities` | `[ADMIN]` Cria nova atividade |
| `PATCH` | `/activities/:id` | `[ADMIN]` Edita atividade |
| `DELETE` | `/activities/:id` | `[ADMIN]` Remove atividade |

**Campos de uma Activity:**
- `title` — Nome da atividade (ex: "Artigo Publicado")
- `description` — Descrição em markdown
- `fixedReward` — XP concedido ao aprovado
- `auditorReward` — XP concedido ao auditor (moderador) ao revisar
- `requiresProof` — Se exige envio de comprovante (URL ou arquivo)
- `isHidden` — Se não aparece no catálogo público (apenas via secretCode)
- `secretCode` — Slug para acesso oculto (eventos/QR Code)
- `cooldownHours` — Anti-farming: horas de espera para submeter a mesma atividade novamente

---

## Submissões

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/submissions` | Envia comprovante de atividade realizada |
| `POST` | `/submissions/redeem` | Resgata atividade oculta via `secretCode` |
| `GET` | `/submissions/me` | Meu histórico de submissões (paginado) |
| `GET` | `/submissions/pending` | `[ADMIN/MODERADOR]` Fila de auditoria (paginado) |
| `GET` | `/submissions` | `[ADMIN/MODERADOR]` Todas as submissões (paginado) |
| `GET` | `/submissions/:id` | Detalhe de uma submissão |
| `PATCH` | `/submissions/:id/review` | `[ADMIN/MODERADOR]` Aprova ou rejeita |
| `PATCH` | `/submissions/:id` | `[ADMIN]` Edita uma submissão |
| `DELETE` | `/submissions/:id/cancel` | Cancela própria submissão pendente |
| `DELETE` | `/submissions/:id` | `[ADMIN]` Remove submissão |

**Body de `POST /submissions`:**
```json
{
  "activityId": "uuid-da-atividade",
  "proofUrl": "https://link-para-comprovante.com",
  "description": "Descrição em markdown do que foi feito"
}
```

**Body de `PATCH /submissions/:id/review`:**
```json
{
  "status": "APPROVED",
  "awardedXp": 50,
  "feedback": "Ótimo artigo!"
}
```

**Status possíveis de uma Submission:** `PENDING` | `APPROVED` | `REJECTED`

---

## Missões

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/missions` | `[PÚBLICO]` Lista missões abertas (`status: OPEN`, não secretas) |
| `GET` | `/missions/:id` | `[PÚBLICO]` Detalhe de uma missão |
| `POST` | `/missions/:id/submit` | Envia submissão para uma missão |
| `GET` | `/missions/:id/my-submission` | Minha submissão nesta missão |
| `GET` | `/missions/admin/all` | `[ADMIN/MODERADOR]` Lista todas as missões |
| `POST` | `/missions` | `[ADMIN]` Cria missão |
| `PATCH` | `/missions/:id` | `[ADMIN]` Edita missão |
| `DELETE` | `/missions/:id` | `[ADMIN]` Remove missão |
| `GET` | `/missions/:id/submissions` | `[ADMIN/MODERADOR]` Lista submissões de uma missão |
| `PATCH` | `/missions/:id/submissions/:submissionId/review` | `[ADMIN/MODERADOR]` Aprova (define vencedor) ou rejeita submissão |

**Campos de uma Mission:**
- `title` — Nome da missão
- `description` — Descrição em markdown (nullable)
- `requirements` — Critérios detalhados em markdown (nullable)
- `xpReward` — XP concedido ao vencedor
- `status` — `OPEN` | `CLOSED`
- `winnerId` — profileId do vencedor (definido ao aprovar; as demais submissões são rejeitadas automaticamente)
- `isSecret` — Se true, não aparece na lista pública

**Body de `POST /missions/:id/submit`:**
```json
{
  "proofUrl": "https://link-para-comprovante.com",
  "description": "Explicação do que foi entregue em markdown"
}
```

**Body de `PATCH /missions/:id/submissions/:submissionId/review`:**
```json
{
  "status": "APPROVED",
  "feedback": "Melhor solução entregue!"
}
```

> Ao aprovar uma submissão de missão, o sistema fecha a missão (`status: CLOSED`), define o `winnerId`, concede o `xpReward` e rejeita todas as outras submissões pendentes automaticamente.

---

## Badges

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/badges` | `[PÚBLICO]` Lista badges ativos |
| `GET` | `/badges/profile/:profileId` | `[PÚBLICO]` Badges de um perfil específico |
| `GET` | `/badges/all` | `[ADMIN]` Lista todos os badges (incluindo inativos) |
| `POST` | `/badges` | `[ADMIN]` Cria badge |
| `PATCH` | `/badges/:id` | `[ADMIN]` Edita badge |
| `DELETE` | `/badges/:id` | `[ADMIN]` Remove badge |
| `POST` | `/badges/grant` | `[ADMIN]` Concede badge manualmente a um perfil |

**Campos de um Badge:**
- `name` — Nome do badge
- `description` — Descrição do critério
- `imageUrl` — URL da imagem (nullable)
- `category` — `MILESTONE` | `RANKING` | `PARTICIPATION` | `SPECIAL`
- `criteriaType` — `AUTOMATIC` | `MANUAL`
- `criteriaConfig` — Configuração do critério automático (ex: `{ "type": "submissions_approved", "threshold": 10 }`)
- `isActive` — Se aparece no catálogo público

---

## Transações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/transactions/me` | Meu extrato de movimentações (paginado) |
| `GET` | `/transactions` | `[ADMIN]` Todas as transações (paginado) |
| `GET` | `/transactions/:id` | `[ADMIN]` Detalhe de uma transação |
| `POST` | `/transactions` | `[ADMIN]` Cria transação manualmente |
| `PATCH` | `/transactions/:id` | `[ADMIN]` Edita transação |
| `DELETE` | `/transactions/:id` | `[ADMIN]` Remove transação |

**Tipos de transação (`type`):** `SUBMISSION_APPROVED` | `GRATITUDE_RECEIVED` | `GRATITUDE_SENT` | `AUDIT_REWARD` | `PENALTY` | `MONTHLY_RESET` | `MISSION_WON`

---

## Rankings

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/rankings/monthly` | `[PÚBLICO]` Top membros do mês (por `currentMonthlyXp`) |
| `GET` | `/rankings/yearly` | `[PÚBLICO]` Top membros do ano (por `currentYearlyXp`) |
| `GET` | `/rankings/global` | `[PÚBLICO]` Hall da Fama (por `totalXp`) |

---

## Notificações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/notifications` | Lista minhas notificações |
| `GET` | `/notifications/unread-count` | Contagem de não lidas (`{ count: number }`) |
| `PATCH` | `/notifications/read-all` | Marca todas como lidas |
| `PATCH` | `/notifications/:id/read` | Marca uma como lida |
| `GET` | `/notifications/preferences` | Minhas preferências de notificação |
| `PATCH` | `/notifications/preferences` | Atualiza preferências de notificação |

---

## Gestão de Usuários (Admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/users` | `[ADMIN]` Lista todos os usuários |
| `POST` | `/users` | `[ADMIN]` Cria usuário manualmente |
| `PATCH` | `/users/:id` | `[ADMIN]` Edita um usuário |
| `DELETE` | `/users/:id` | `[ADMIN]` Remove um usuário |

---

## Admin — Métricas e Saúde

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/metrics` | `[ADMIN]` Métricas gerais da plataforma |
| `GET` | `/admin/health` | `[ADMIN]` Status dos serviços externos (DB, SMTP, Storage) |

**Resposta de `/admin/metrics`:**
```json
{
  "totalUsers": 120,
  "activeUsers": 98,
  "bannedUsers": 2,
  "submissionsPending": 5,
  "submissionsApprovedThisMonth": 42,
  "submissionsRejectedThisMonth": 8,
  "totalXpDistributed": 18500,
  "tokensInCirculation": 230
}
```

**Resposta de `/admin/health`:**
```json
{
  "database": { "ok": true },
  "smtp": { "ok": true },
  "storage": { "ok": false, "error": "NoSuchBucket" },
  "allOk": false
}
```

---

Anterior: [Autenticação](autenticacao.md) | Próximo: [Formulários](formularios.md)
