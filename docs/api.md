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
| `GET` | `/gamification-profiles/:username` | `[PÚBLICO]` Perfil público de qualquer membro |

**Resposta de `/gamification-profiles/me`:**
```json
{
  "id": "uuid",
  "username": "@handle",
  "totalXp": 1500,
  "currentMonthlyXp": 200,
  "currentYearlyXp": 800,
  "gratitudeTokens": 5,
  "currentLevel": "Junior"
}
```

---

## Catálogo de Atividades

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/activities` | `[PÚBLICO]` Lista atividades disponíveis (paginado) |
| `GET` | `/activities/hidden/:secretCode` | Acessa atividade oculta por código/QR Code |
| `POST` | `/activities` | `[ADMIN]` Cria nova atividade no catálogo |

**Campos de uma Activity:**
- `title` — Nome da atividade (ex: "Artigo Publicado")
- `description` — Descrição
- `fixedReward` — XP concedido
- `requiresProof` — Se exige envio de comprovante (URL ou arquivo)
- `isHidden` — Se não aparece no catálogo público (apenas via QR Code)
- `cooldownHours` — Anti-farming: horas de espera para submeter a mesma atividade novamente

---

## Submissões

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/submissions` | Envia comprovante de atividade realizada |
| `GET` | `/submissions/me` | Meu histórico de submissões |
| `GET` | `/submissions/pending` | `[MODERADOR]` Fila de auditoria |
| `POST` | `/submissions/:id/review` | `[MODERADOR]` Aprova ou rejeita uma submissão |

**Body de `POST /submissions`:**
```json
{
  "activityId": "uuid-da-atividade",
  "proofUrl": "https://link-para-comprovante.com"
}
```

**Body de `POST /submissions/:id/review`:**
```json
{
  "status": "APPROVED",       
  "awardedXp": 50,            
  "feedback": "Ótimo artigo!" 
}
```

**Status possíveis de uma Submission:** `PENDING` | `APPROVED` | `REJECTED`

---

## Tokens de Gratidão (Economia P2P)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/tokens/transfer` | Transfere tokens de gratidão para outro membro |
| `GET` | `/transactions/me` | Extrato de movimentações de XP do mês |

**Body de `POST /tokens/transfer`:**
```json
{
  "toUsername": "@handle-do-destinatario",
  "amount": 2,
  "feedbackMessage": "Valeu pela ajuda com o TypeScript!"
}
```

> Tokens não utilizados expiram no dia 1 de cada mês. Cada membro recebe uma cota mensal definida pelo sistema.

---

## Rankings

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/rankings/monthly` | `[PÚBLICO]` Top membros do mês |
| `GET` | `/rankings/yearly` | `[PÚBLICO]` Top membros do ano |
| `GET` | `/rankings/global` | `[PÚBLICO]` Hall da Fama (XP histórico total) |

---

## Gestão de Usuários (Admin Panel)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/users` | `[ADMIN]` Lista todos os usuários |
| `POST` | `/users` | `[ADMIN]` Cria usuário manualmente |
| `PATCH` | `/users/:id` | `[ADMIN]` Edita um usuário |
| `DELETE` | `/users/:id` | `[ADMIN]` Remove um usuário |

---

Anterior: [Autenticação](autenticacao.md) | Próximo: [Formulários](formularios.md)
