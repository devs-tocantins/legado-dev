# Gamificação

Este documento descreve as regras de negócio do sistema de gamificação do legado.dev.

---

## 📜 Manifesto do Legado Dev

O **Legado Dev** existe para fortalecer o ecossistema de tecnologia do **Tocantins**. Para manter a integridade do sistema, toda submissão deve seguir estes pilares:

### 1. O Pilar do Voluntariado (Sem Ganhos Pessoais)
A essência do sistema é a doação de tempo e conhecimento. Se você recebeu qualquer compensação financeira pela atividade, ela **não** gera pontos.

### 2. O Pilar da Localidade (Foco no Tocantins)
O impacto deve ser sentido dentro das fronteiras do estado ou beneficiar diretamente membros da comunidade tocantinense.

### 3. Igualdade de Níveis
No Legado Dev, **XP não é ego**. O seu nível no sistema reflete seu histórico de contribuição, não sua senioridade no mercado. Uma ajuda de um usuário "Lenda" é validada com o mesmo rigor que a de um "Novato".

---

## Níveis (Level do Perfil)

O level é calculado dinamicamente a partir do `totalXp` do perfil. Nunca é armazenado; é computado no momento da leitura.

| Nível | XP mínimo | Estimativa de tempo* |
|-------|-----------|----------------------|
| Novato | 0 | Imediato |
| Contribuidor | 500 | ~1–2 semanas ativas |
| Colaborador Ativo | 2.000 | ~1–3 meses |
| Referência | 6.000 | ~6–12 meses |
| Mentor | 15.000 | ~1–2 anos |
| Lenda | 35.000 | ~3+ anos |

*Estimativas baseadas em contribuição consistente (não acúmulo forçado).

---

## Fontes de XP

| Fonte | XP | Observação |
|-------|----|------------|
| Atividade aprovada | `activity.fixedReward` | Definido pelo admin por atividade (XP de Comunidade) |
| Token de gratidão recebido | +1 XP por token | Afeta `totalXp` e `currentMonthlyXp` |
| Revisão de submissão aprovada (moderador) | `MODERATOR_REWARD_XP` (fixo, 3 XP) | Paga só quando o moderador **aprova**; rejeição não gera XP. Aparece no Histórico (privado e público) identificado como recompensa de moderação, para transparência |
| Missão vencida | `mission.xpReward` | Definido pelo admin por missão |
| Conclusão de item de Trilha | `item.journeyXp` | Concede XP de Jornada (contador separado de aprendizado) |
| Avaliação de curso | 10 XP fixo | XP de Comunidade; qualquer membro pode avaliar um curso `VERIFIED`, mesmo sem tê-lo concluído formalmente |
| Penalidade (admin) | Negativo (configurável) | Deduz XP por abuso |

---

## XP de Comunidade vs. XP de Jornada

O sistema diferencia dois tipos de experiência:
- **XP de Comunidade** (`totalXp`, `currentMonthlyXp`, `currentYearlyXp`): obtido via atividades de voluntariado, missões, moderação e recebimento de tokens de gratidão. Alimenta os níveis e o Leaderboard da comunidade.
- **XP de Jornada** (`journeyXp`): obtido exclusivamente ao progredir e concluir itens nas **Trilhas de Aprendizado**. É um indicador de evolução técnica individual que não entra nos rankings competitivos da comunidade.

### Trilha não é contribuição

Um marco de trilha (`TrackItem` do tipo `PROOF`) usa a mesma tabela de
`Submission` que uma atividade de voluntariado — mas **não é** uma
contribuição para a comunidade, mesmo quando a prova é aprovada de verdade
(e ainda menos quando o usuário só pula via test-out, ganhando 0 XP). O
campo `Submission.contributionKind` formaliza essa distinção:
- `COMMUNITY_ACTIVITY` — atividade real de voluntariado.
- `TRACK_PROGRESS` — progresso pessoal de trilha (prova aprovada ou test-out).

Selos de "contribuição" (ex: "Primeira Missão", "Colaborador", "Herói da
Comunidade") só contam submissões `COMMUNITY_ACTIVITY` aprovadas — nunca
progresso de trilha. Antes dessa distinção existir, um test-out (0 XP, sem
nenhuma ajuda real à comunidade) chegava a conceder o selo "Primeira
Missão", porque a submissão ficava com `status = APPROVED` e o critério só
olhava para o status, não para o tipo.

---

## Rankings e Mural de Campeões

| Tipo | Campo base | Reset |
|------|-----------|-------|
| Mensal | `currentMonthlyXp` | Dia 1 de cada mês (cron) |
| Anual | `currentYearlyXp` | Dia 1 de janeiro (cron) |
| Global (Hall da Fama) | `totalXp` | Nunca |

Ao final de cada ciclo (mensal ou anual), o cron armazena um **Ranking Snapshot** imutável com o campeão do período (`xpAtSnapshot`, `periodKey`).

### 🏛️ Mural de Campeões
No Leaderboard, o **Mural de Campeões** exibe em destaque o campeão do período **JÁ FECHADO** (ex: o vencedor de `2026-06` ou do ano anterior), diferenciando-se da tabela em tempo real que mostra a disputa do período corrente.

O reset mensal zera `currentMonthlyXp` e renova a cota de `gratitudeTokens`. O reset anual zera `currentYearlyXp`. Ambos são executados por cron jobs do NestJS (`@nestjs/schedule`).

---

## Tokens de Gratidão (Economia P2P)

- Cada membro recebe uma cota **mensal** de tokens de gratidão.
- Tokens são transferidos para outros membros como reconhecimento por ajudas.
- Ao receber tokens: +1 XP por token (afeta `totalXp` e `currentMonthlyXp`).
- Tokens não transferidos expiram no fim de cada mês (reset mensal pelo cron).
- A transferência não passa por moderação — é imediata.
- Remetente perde tokens; destinatário ganha XP e tokens recebidos ficam registrados na Transaction.

---

## Badges (Medalhas)

### Categorias

| Categoria | Descrição |
|-----------|-----------|
| `MILESTONE` | Marcos de XP ou contribuições acumuladas (ex: "100 submissões aprovadas") |
| `RANKING` | Posições de destaque em rankings (ex: "Top 3 mensal") |
| `PARTICIPATION` | Participação em eventos ou missões |
| `SPECIAL` | Badges manuais para casos excepcionais |

### Critérios automáticos (`criteriaConfig`)

Badges com `criteriaType: AUTOMATIC` têm um `criteriaConfig` JSON com o critério a verificar:

```json
{ "type": "submissions_approved", "threshold": 10 }
{ "type": "total_xp", "threshold": 500 }
{ "type": "monthly_ranking_top", "threshold": 3 }
```

A verificação ocorre automaticamente (via cron ou ao aprovar uma submissão). Se o critério for atendido e o badge ainda não tiver sido concedido, o sistema atribui automaticamente.

`submissions_approved` conta apenas `Submission` com `status = APPROVED`, `isTestOut = false` e `contributionKind = COMMUNITY_ACTIVITY` — ver [Trilha não é contribuição](#trilha-não-é-contribuição) acima.

### Badges manuais

Badges com `criteriaType: MANUAL` são concedidos pelo admin via `POST /badges/grant`. Úteis para reconhecimentos únicos que não se encaixam em critérios automáticos.

### Exibição no perfil

- Badges são agrupados por categoria no perfil público
- Cada badge exibe nome, imagem e descrição em tooltip
- Badges inativos (`isActive: false`) não aparecem no catálogo público nem no perfil

---

## Histórico do Perfil Público (`/u/[username]`)

O componente `ProfileHistoryTimeline` (`src/components/profile-history-timeline.tsx`)
mistura eventos de várias fontes numa linha do tempo única, cada um numa
categoria própria — a regra geral é: **tudo que gera XP deve aparecer, na
categoria certa; nada com 0 XP (ex: test-out) deve aparecer**.

| Categoria (`HistoryEventType`) | Fonte | O que mostra |
|---|---|---|
| `trilha` | `GET /learning-tracks/proof-portfolio` | Marcos de trilha realmente concluídos (test-out já vem filtrado pelo backend) |
| `voluntariado` | `GET /gamification-profiles/:id/approved-submissions`, filtrado a `trackItemId == null` no frontend | Só contribuição real à comunidade — marcos de trilha nunca entram aqui, mesmo aprovados |
| `curso` | `GET /gamification-profiles/:id/course-reviews` | Avaliações de curso, exibidas discretamente ("Avaliou o curso X"), sem destaque de XP |
| `ranking` | `GET /gamification-profiles/:id/ranking-history` | Top 3 em rankings mensais/anuais |
| `moderation` | `GET /learning-tracks/moderation-history` (via `profile-portfolio.service.ts`) | Recompensa de moderação (`AUDITOR_REWARD`) |

O filtro de `voluntariado` por `trackItemId == null` existe porque o endpoint
de submissões aprovadas retorna qualquer `Submission` aprovada, incluindo
marcos de trilha e test-outs (que também ficam com `status = APPROVED`,
mesmo sem XP) — sem esse filtro, um test-out aparecia como se fosse uma
contribuição real à comunidade.

---

## Missões

Missões são desafios únicos com vencedor único e recompensa de alto valor.

### Fluxo completo

1. Admin cria a missão (`POST /missions`) com `title`, `description`, `requirements`, `xpReward`
2. Missão fica com `status: OPEN` e aparece na listagem pública (se `isSecret: false`)
3. Membros submetem participações (`POST /missions/:id/submit`) com `proofUrl` e `description`
4. Moderador/admin revisa as submissões (`GET /missions/:id/submissions`) e aprova a melhor
5. Ao **aprovar**:
   - `Mission.status` passa para `CLOSED`
   - `Mission.winnerId` recebe o profileId do vencedor
   - Vencedor recebe o `xpReward` via `Transaction(MISSION_WON)`
   - Todas as outras submissões pendentes são **rejeitadas automaticamente**
6. Missão fechada não aceita mais submissões

### Anti-duplicidade

Um perfil só pode ter uma submissão por missão. Tentativa de submeter novamente retorna erro.

---

## Anti-Fraude

- **Cooldown por atividade**: campo `cooldownHours` impede que o mesmo perfil submeta a mesma atividade múltiplas vezes em sequência
- **Moderação obrigatória**: todas as submissões de atividade passam por revisão humana
- **Logs imutáveis**: toda mutação de XP gera uma Transaction com motivo e referência
- **Penalidade admin**: admins podem deduzir XP via modal de penalidade no painel (`POST /gamification-profiles/:id/penalty`)
- **Sanitização de entrada**: campos de texto markdown aceitam apenas ASCII imprimível + Latin Extended — sem emojis, Unicode especial ou caracteres de controle que possam travar a UI

---

## Cron Jobs

| Job | Frequência | O que faz |
|-----|-----------|-----------|
| Reset mensal | Todo dia 1 do mês às 00:00 | Zera `currentMonthlyXp` e renova `gratitudeTokens` de todos os perfis; registra snapshot do ranking e gera Transaction(MONTHLY_RESET) |
| Reset anual | Todo dia 1 de janeiro às 00:00 | Zera `currentYearlyXp` de todos os perfis e registra snapshot do ranking anual |
| Verificação de badges | Após aprovar submissão / cron periódico | Verifica critérios automáticos e concede badges não atribuídos |
