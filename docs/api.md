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

## Perfil de Gamificação e Rankings

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/gamification-profiles/me` | Meu XP (mensal, anual, total), level e tokens de gratidão |
| `PATCH` | `/gamification-profiles/me` | Atualiza username, githubUsername, bannerPreset |
| `GET` | `/gamification-profiles/check-username/:username` | `[PÚBLICO]` Verifica disponibilidade de username (`{ available: boolean }`) |
| `GET` | `/gamification-profiles/by-username/:username` | `[PÚBLICO]` Perfil público por @handle |
| `GET` | `/gamification-profiles/:id` | `[PÚBLICO]` Perfil público por ID |
| `GET` | `/gamification-profiles/:id/approved-submissions` | `[PÚBLICO]` Submissões aprovadas de um perfil (paginado) |
| `POST` | `/gamification-profiles/transfer` | Transfere tokens de gratidão para outro membro |
| `GET` | `/gamification-profiles` | `[PÚBLICO]` Lista/ordena perfis para o ranking (parâmetros `page`, `limit`, `sort`) |
| `POST` | `/gamification-profiles` | `[ADMIN]` Cria perfil manualmente |
| `PATCH` | `/gamification-profiles/:id` | `[ADMIN]` Edita perfil de gamificação |
| `POST` | `/gamification-profiles/:profileId/penalty` | `[ADMIN]` Aplica penalidade (deduz XP) |
| `DELETE` | `/gamification-profiles/:id` | `[ADMIN]` Remove perfil |

**Body de `POST /gamification-profiles/transfer`:**
```json
{
  "recipientProfileId": "uuid-do-destinatario",
  "amount": 2,
  "message": "Valeu pela ajuda com o TypeScript!"
}
```

**Body de `POST /gamification-profiles/:profileId/penalty`:**
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
> Nota: `gratitudeTokens` são renovados mensalmente no dia 1 de cada mês.

---

## Ranking Snapshots (Mural de Campeões)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/ranking-snapshots/champion` | `[PÚBLICO]` Retorna o campeão do período encerrado (`type: "monthly"` ou `"yearly"`) |
| `GET` | `/ranking-snapshots/profile/:profileId` | `[PÚBLICO]` Histórico de posições e campeonatos de um perfil |

---

## Trilhas de Aprendizado (`learning-tracks`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/learning-tracks` | `[PÚBLICO]` Lista trilhas de aprendizado ativas |
| `GET` | `/learning-tracks/:id` | `[PÚBLICO]` Detalhes da trilha |
| `GET` | `/learning-tracks/:id/overview` | `[PÚBLICO]` Visão geral das seções e itens da trilha |
| `GET` | `/learning-tracks/:id/progress` | Progresso do usuário autenticado na trilha |
| `POST` | `/track-enrollments` | Matricular-se em uma trilha |
| `POST` | `/track-items/:id/complete` | Marcar item/marco da trilha como concluído |
| `GET` | `/track-items/:id` | Detalhes de um item da trilha |
| `GET` | `/profile-portfolio/:profileId` | `[PÚBLICO]` Portfólio de comprovação de itens e marcos concluídos |
| `POST` | `/learning-tracks` | `[ADMIN]` Criar nova trilha |
| `PATCH` | `/learning-tracks/:id` | `[ADMIN]` Atualizar trilha |
| `DELETE` | `/learning-tracks/:id` | `[ADMIN]` Remover trilha |
| `POST` | `/track-sections` | `[ADMIN]` Criar seção da trilha |
| `PATCH` | `/track-sections/:id` | `[ADMIN]` Editar seção da trilha |
| `DELETE` | `/track-sections/:id` | `[ADMIN]` Deletar seção da trilha |
| `POST` | `/track-items` | `[ADMIN]` Criar item de trilha |
| `PATCH` | `/track-items/:id` | `[ADMIN]` Editar item de trilha |
| `DELETE` | `/track-items/:id` | `[ADMIN]` Deletar item de trilha |
| `POST` | `/track-suggestions` | Enviar sugestão de nova trilha |
| `GET` | `/track-suggestions` | `[ADMIN]` Listar sugestões de trilhas |
| `PATCH` | `/track-suggestions/:id/review` | `[ADMIN]` Marcar sugestão como revisada |

---

## Eventos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/events` | `[PÚBLICO]` Lista eventos com suporte a filtros (`category`, `modality`) |
| `GET` | `/events/mine` | Eventos criados pelo usuário logado ou que se inscreveu |
| `GET` | `/events/pending` | `[ADMIN/MODERADOR]` Eventos aguardando aprovação |
| `GET` | `/events/all` | `[ADMIN/MODERADOR]` Todos os eventos cadastrados |
| `GET` | `/events/:id` | `[PÚBLICO]` Detalhes de um evento |
| `GET` | `/events/:id/manage` | Painel de gestão do evento |
| `POST` | `/events` | Propor / criar novo evento |
| `PATCH` | `/events/:id` | Editar dados do evento |
| `PATCH` | `/events/:id/review` | `[ADMIN/MODERADOR]` Aprovar ou rejeitar evento proposto |
| `DELETE` | `/events/:id` | Excluir evento |
| `PATCH` | `/events/:id/cancel` | Cancelar evento |
| `POST` | `/events/:id/subscribe` | Inscrever-se em um evento |
| `DELETE` | `/events/:id/subscribe` | Cancelar inscrição em um evento |
| `GET` | `/events/:id/subscription` | Verificar status da inscrição no evento (`{ subscribed: boolean }`) |

---

## Cursos Comunitários e Avaliações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/courses` | `[PÚBLICO]` Lista cursos aprovados |
| `GET` | `/courses/pending` | `[ADMIN/MODERADOR]` Cursos pendentes de revisão |
| `GET` | `/courses/:courseId` | `[PÚBLICO]` Detalhes de um curso |
| `POST` | `/courses` | Submeter / sugerir um novo curso |
| `PATCH` | `/courses/:id` | `[ADMIN]` Editar curso |
| `PATCH` | `/courses/:id/review` | `[ADMIN/MODERADOR]` Aprovar (`VERIFIED`) ou rejeitar curso |
| `DELETE` | `/courses/:id` | `[ADMIN]` Remover curso |
| `GET` | `/course-reviews/by-course/:courseId` | `[PÚBLICO]` Lista avaliações de um curso |
| `GET` | `/course-reviews/my-review/:courseId` | Minha avaliação neste curso |
| `POST` | `/course-reviews` | Enviar avaliação e nota (1 a 5 estrelas) |
| `PATCH` | `/course-reviews/:id` | Atualizar minha avaliação |
| `DELETE` | `/course-reviews/:id` | Excluir minha avaliação |

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
- `effortTiers` — Faixas de esforço opcionais (Pequeno/Médio/Grande/Épico), cada uma com seu próprio XP; se ausente, usa `fixedReward`
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

## Denúncias de Submissões (`contribution-reports`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/contribution-reports` | Envia uma denúncia sobre submissão inadequada ou suspeita |
| `GET` | `/contribution-reports/admin/pending` | `[ADMIN/MODERADOR]` Lista denúncias pendentes de análise |
| `PATCH` | `/contribution-reports/admin/:id/review` | `[ADMIN/MODERADOR]` Revisa denúncia (`DISMISSED` ou `UPHELD`) |

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

---

## Notificações e Preferências

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/notifications` | Lista minhas notificações |
| `GET` | `/notifications/unread-count` | Contagem de não lidas (`{ count: number }`) |
| `PATCH` | `/notifications/read-all` | Marca todas como lidas |
| `PATCH` | `/notifications/:id/read` | Marca uma como lida |
| `GET` | `/notifications/preferences` | Minhas preferências de notificação |
| `PATCH` | `/notifications/preferences` | Atualiza preferências de notificação (e-mail / WhatsApp) |

---

## Gestão de WhatsApp (`[ADMIN]`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/whatsapp/admin/status` | `[ADMIN]` Obtém o status da conexão do bot de WhatsApp |
| `GET` | `/whatsapp/admin/qrcode` | `[ADMIN]` Obtém QR Code para vincular WhatsApp |
| `POST` | `/whatsapp/admin/logout` | `[ADMIN]` Desconecta o bot |
| `POST` | `/whatsapp/admin/send-test` | `[ADMIN]` Envia mensagem de teste via WhatsApp |

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

---

Anterior: [Autenticação](autenticacao.md) | Próximo: [Formulários](formularios.md)

