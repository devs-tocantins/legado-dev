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
| Atividade aprovada | `activity.fixedReward` | Definido pelo admin por atividade |
| Token de gratidão recebido | +1 XP por token | Afeta `totalXp` e `currentMonthlyXp` |
| Revisão de submissão (moderador) | `activity.auditorReward` | Recompensa customizável por atividade |
| Missão vencida | `mission.xpReward` | Definido pelo admin por missão |
| Penalidade (admin) | Negativo (configurável) | Deduz XP por abuso |

---

## Rankings

| Tipo | Campo base | Reset |
|------|-----------|-------|
| Mensal | `currentMonthlyXp` | Dia 1 de cada mês (cron) |
| Anual | `currentYearlyXp` | Dia 1 de janeiro (cron) |
| Global (Hall da Fama) | `totalXp` | Nunca |

O reset mensal zera `currentMonthlyXp` e o reset diário renova os `gratitudeTokens`. O reset anual zera `currentYearlyXp`. Ambos são executados por cron jobs do NestJS (`@nestjs/schedule`).

---

## Tokens de Gratidão (Economia P2P)

- Cada membro recebe uma cota **diária** de tokens de gratidão.
- Tokens são transferidos para outros membros como reconhecimento por ajudas.
- Ao receber tokens: +1 XP por token (afeta `totalXp` e `currentMonthlyXp`).
- Tokens não transferidos expiram no fim de cada dia (reset pelo cron).
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

### Badges manuais

Badges com `criteriaType: MANUAL` são concedidos pelo admin via `POST /badges/grant`. Úteis para reconhecimentos únicos que não se encaixam em critérios automáticos.

### Exibição no perfil

- Badges são agrupados por categoria no perfil público
- Cada badge exibe nome, imagem e descrição em tooltip
- Badges inativos (`isActive: false`) não aparecem no catálogo público nem no perfil

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
| Reset mensal | Todo dia 1 do mês às 00:00 | Zera `currentMonthlyXp` e `gratitudeTokens` de todos os perfis; gera Transaction(MONTHLY_RESET) |
| Reset anual | Todo dia 1 de janeiro às 00:00 | Zera `currentYearlyXp` de todos os perfis |
| Verificação de badges | Após aprovar submissão / cron periódico | Verifica critérios automáticos e concede badges não atribuídos |
