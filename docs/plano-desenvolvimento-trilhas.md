# Plano de desenvolvimento — Trilhas de aprendizado (dividido em issues)

> Rascunho de planejamento. Base conceitual/decisões em `plano-engajamento.md`.
> Ainda sem commit; nada implementado.

## Falta algo antes de começar?

**Não, para o backend.** Modelo de dados, ordenação (índice fracionário),
soft-delete, progresso desacoplado e reuso da moderação já estão decididos — dá
pra começar já. Pontos ainda "maturando" (ex.: quando um marco também dá XP de
Comunidade) **não bloqueiam**: viram um flag opcional `grantsCommunityXp` no
marco, desligado por padrão.

**O design bloqueia só o frontend.** Enquanto a IA de design trabalha, tocamos
**backend + conteúdo da trilha** em paralelo.

## Como paralelizar

- **Agora, sem depender do design:** Milestones 1–4 (backend) e 5 (conteúdo).
- **Depois do design aprovado:** Milestone 6 (frontend).
- **Pós-MVP / sob demanda:** Milestone 7 (admin CRUD de trilhas).

Padrão do repo por issue de backend: migration + entity + domain + mapper +
repository + service + controller + **specs**, seguindo os módulos `events`/
`submissions` como referência.

---

## Milestone 1 — Fundação do modelo (backend)

**ISSUE 1 — Entidades base da trilha + migration**
- `learning_track`, `track_section` (com `position` fracionário, `status`,
  `badgeId?` → badge), `track_item` (discriminada por `type`, `position`,
  `status` soft-delete, `journeyXp`, `config` jsonb, FKs opcionais
  `activityId?`/`missionId?`/`courseId?`). Domain + mapper + repository.
- **Aceite:** migration sobe/desce local; CRUD por repositório coberto por specs.

**ISSUE 2 — Catálogo de cursos + avaliações**
- `course` (status pending/verified/rejected) e `course_review`
  (unique course+profile). Domain/mapper/repository.
- **Aceite:** migration ok; specs de criação/verificação/review.

**ISSUE 3 — Matrícula e progresso**
- `track_enrollment` (unique track+profile) e `track_item_completion`
  (unique item+profile, `submissionId?`, `awardedJourneyXp`).
- **Aceite:** migration ok; specs.

**ISSUE 4 — Moeda de Jornada no perfil**
- Coluna `journeyXp` em `gamification_profile` (migration + entity/domain/mapper),
  denormalizada como o `totalXp`.
- **Aceite:** perfil expõe `journeyXp`; specs do mapper.

## Milestone 2 — Percorrer a trilha (API de leitura/consumo)

**ISSUE 5 — Listagem e visão da trilha**
- Endpoints: listar trilhas publicadas; ver uma trilha com etapas/itens **ativos
  ordenados** (`section.position`, depois `item.position`).
- **Aceite:** ordem correta; itens arquivados não aparecem; specs de controller/service.

**ISSUE 6 — Matrícula + "posição atual" derivada**
- Entrar numa trilha; endpoint de progresso que retorna a **posição atual** =
  primeiro item ativo sem conclusão para o profile.
- **Aceite:** editar/arquivar itens não corrompe progresso (teste cobrindo isso).

**ISSUE 7 — Conclusão de itens automáticos**
- `RESOURCE`/`TEXT` (auto-declarado) e `CHECKPOINT`/quiz (auto-corrigido via
  `config`): criam `track_item_completion` e creditam `journeyXp`.
- **Aceite:** conclusão idempotente (unique); XP creditado uma vez; specs.

## Milestone 3 — Prova, moderação e títulos

**ISSUE 8 — Marco PROOF integrado à moderação existente**
- `submission.trackItemId?` opcional; ao aprovar na moderação já existente, criar
  `track_item_completion` (com `submissionId`), creditar Jornada — e Comunidade
  se `grantsCommunityXp`.
- **Aceite:** aprovar prova de trilha gera conclusão + XP corretos; fluxo antigo
  de submissão sem `trackItemId` continua igual (retrocompat); specs.

**ISSUE 9 — Test-out (provar e pular)**
- Enviar prova direto para marco `allowsTestOut`; conclusão marcada
  `skipped_testout`.
- **Aceite:** pular respeita pré-requisitos da etapa; specs.

**ISSUE 10 — Selo/título ao concluir etapa**
- Ao completar os itens obrigatórios de uma `track_section`, conceder
  `section.badgeId` (reusar `badge-evaluator`) + notificação. Gancho para card
  compartilhável (`/api/og`).
- **Aceite:** selo concedido uma única vez; notificação disparada; specs.

## Milestone 4 — Catálogo de cursos (API)

**ISSUE 11 — Cadastro, verificação e avaliação de cursos**
- Cadastrar (status pending), listar verificados, avaliar (review atrelado a
  conclusão comprovada), verificação após N conclusões/moderação (anti-spam).
- **Aceite:** curso não-verificado não aparece na listagem pública; specs.

## Milestone 5 — Conteúdo (autoria via seed — Fase A)

**ISSUE 12 — Formato de seed + Trilha "Backend inicial"**
- Definir o formato de seed de trilha e escrever a **Trilha Backend inicial**
  (etapas e marcos até o nível informal "pronto para estagiar").
- **Aceite:** rodar o seed cria a trilha completa no banco; um usuário consegue
  percorrer ponta a ponta via API.

## Milestone 6 — Frontend (design aprovado — direção "Construtor")

> Design produzido pela IA de design (Claude Design), projeto "Trilhas de
> aprendizado legado.dev", arquivo `Trilhas - Catálogo.dc.html`. O arquivo
> continha 3 explorações da tela de catálogo (A "Console", B "Dossiê", 2A
> "Construtor") — **só a 2A foi levada adiante** e desenvolvida em 6 telas
> completas (2A→7A). Direção **escolhida: "Construtor"** — colorida, tátil
> (cards/botões com sombra sólida deslocada, sem blur), cor própria por trilha,
> mascote no hub, barra de progresso em "tijolos", selo ◆ como unidade visual de
> credencial. Tipografia: Space Grotesk (UI) + JetBrains Mono (labels/meta).
>
> **Nota de integração:** essa paleta (violeta `oklch(0.55 0.2 285)` + cores por
> trilha) e essa linguagem tátil são **diferentes** da identidade atual do site
> (dark + dourado `#E59B13`, ver `hero-logo-3d.tsx`). Foi proposital — o
> briefing pediu originalidade, não clonar a marca atual. Decidir na
> implementação: adotar essa paleta como a identidade da área de Trilhas, ou
> adaptar para o dourado atual. Recomendação: manter a paleta nova (é o que foi
> aprovado), mantendo tipografia/spacing coerentes com o resto do site.
>
> **Achados novos do design** (não previstos no modelo original, capturados no
> `plano-engajamento.md`): trilhas têm **tier** (`alicerce`/`pilar`/`arco`) e
> podem ter **pré-requisito de outra trilha** (`locked`+`req`, ex.: "DevOps
> essencial" só abre após concluir "Backend inicial"); e um widget de **"meta da
> semana"** (N marcos concluídos esta semana) no hub.
>
> **Decisão confirmada:** quem valida provas continua sendo **só moderador**
> (papel já existente). A tela "Validar prova" do design é uma **extensão da
> moderação atual**, não um novo papel de "validador por reputação" — o número
> de reputação exibido ali é só informativo.

**ISSUE 13 — Tipos + serviços de API (front)**
- Tipos e serviços para trilhas, seções, itens, progresso, cursos. Formatos
  vistos no protótipo (`stages`: `{n, label, state, status}`; `trails`:
  `{name, tierKey, seal, colorKey, abbr, prove, etapas, marcos, dur, locked, req}`)
  ajudam a moldar os DTOs de leitura.

**ISSUE 14 — Tela "Trilhas" (hub/catálogo)** — mockup **2A**
- Hero "continuar sua trilha": mascote, barra de tijolos (etapas concluídas/
  atual/bloqueadas), CTA "Continuar" apontando pro próximo marco.
- Grade de trilhas: card por trilha com cor própria, selo do tier, descrição do
  que ela prova, nº de etapas, duração estimada; estado **bloqueada** com motivo
  ("Conclua Backend inicial").
- Rail lateral: "Meta da semana" (anel de progresso), "Próximo selo" (barra +
  texto do que falta), "Sua reputação" (número + CTA para a fila de moderação,
  se o usuário for moderador).
- **Aceite:** grid responsivo; estado locked non-clicável; CTA principal leva
  direto ao próximo marco pendente (usa a "posição atual derivada" da API).

**ISSUE 15 — Tela "Dentro da trilha" (percorrer)** — mockup **3A**
- Breadcrumb + hero (mesmo padrão de tijolos + CTA do hub, contextual à trilha).
- "Espinha" vertical de etapas: nó numerado (concluído/atual/bloqueado) ligado
  por trilho; etapa atual expandida mostrando seus marcos com badge de tipo
  (RECURSO/PROVA/QUIZ) e ação (Começar/Ver); etapas futuras bloqueadas com
  cadeado e motivo.
- Rail lateral: próximo passo, progresso do selo, atalho de test-out, texto de
  confiança sobre a validação.
- **Aceite:** ordem e estados vêm da API de leitura (issue #51) + progresso
  (issue #52); etapa bloqueada não expande.

**ISSUE 16 — Tela "Cumprir marco"** — mockup **4A**
- Bloco do recurso externo (tipo, título, descrição, botão "abrir no site
  externo") + checkbox "já estudei" (auto-declarado, honestidade primeiro — não
  credita XP sozinho).
- Bloco de prova (separado, obrigatório para o marco realmente fechar):
  critérios numerados vindos de `track_item.config`, dropzone de link/print,
  botão "Enviar prova" → cria `submission` com `trackItemId`.
- Variante de quiz (`CHECKPOINT`): perguntas + opções, correção automática.
- Rail lateral: progresso da etapa em tijolos, atalho de test-out, texto de
  confiança ("moderadores revisam em até 48h").
- **Aceite:** enviar prova não credita XP até aprovação (estado "em análise");
  quiz correto credita na hora; reusa serviços de submissão existentes.

**ISSUE 17 — Tela "Conquista do selo"** — mockup **5A**
- Card de celebração ao concluir a etapa/trilha (selo, estatísticas reais:
  etapas, marcos provados, dias de trilha), ações "Compartilhar conquista" /
  "Ver no perfil", teaser do próximo selo.
- **Aceite:** dispara ao completar todos os itens obrigatórios da etapa/trilha
  (issue #56); botão compartilhar gera/leva ao card `/api/og`.

**ISSUE 18 — Perfil público como credencial** — mockup **6A**
- Header com "copiar link do perfil"; hero (avatar, nome, headline, selos:
  conquistado/em progresso/bloqueado); linha de estatísticas (reputação, provas
  concluídas, provas validadas por ela — só se for moderador); seção **"Portfólio
  de provas"**: grid de cards, cada um com cor/selo da trilha, título do que foi
  provado de fato e "validada por N pares".
- **Aceite:** integra em `/u/[username]` sem quebrar o que já existe ali.

**ISSUE 19 — Catálogo de cursos (front)**
- Listar, cadastrar e avaliar cursos. **Sem mockup no protótipo atual** — o
  design cobriu marcos de trilha, não uma tela dedicada de catálogo de cursos;
  seguir padrões visuais das telas 14/16 até (se necessário) um mockup próprio.

**ISSUE 20 — Fila de validação de provas de trilha (extensão da moderação)** — mockup **7A**
- **Não é feature nova de permissão** — é uma view a mais dentro do
  `admin-panel`/moderação **já existente**, restrita a moderadores (papel atual).
  Lista de provas pendentes (avatar, nome, marco+etapa, "enviado há X"); painel
  de detalhe (evidência anexada, link, critérios do marco como checklist,
  Aprovar/Pedir ajuste).
- **Aceite:** reusa o fluxo de aprovação de submissão (issue #54); só acessível
  a quem já tem o papel de moderador/admin.

## Milestone 7 — Admin CRUD de trilhas (pós-MVP, sob demanda)

**ISSUE 19 — Autoria pela tela (Fase B)**
- CRUD de trilhas/etapas/itens por admin, sobre o mesmo modelo. Só quando houver
  mantenedor não-dev. Respeitar edição não-destrutiva (arquivar, não apagar).

---

## Transversais
- **Testes** em toda issue de backend (padrão de specs do repo).
- **Instrumentação** leve (submissões/semana, usuários ativos por trilha) para
  medir e iterar — pode ser uma issue própria quando houver o que medir.

## Ordem recomendada
1 → 2 → 3 → 4 (fundação) · 5 → 6 → 7 (consumo) · 8 → 9 → 10 (prova/títulos) ·
11 (cursos) · 12 (conteúdo) — tudo isso já em andamento. Frontend (13–20) agora
liberado pelo design: 13 (tipos/serviços) primeiro; depois 14/15/16 (hub →
trilha → cumprir marco, o núcleo da experiência); 17/18 (conquista/perfil) e 20
(fila de validação) podem seguir em paralelo; 19 (catálogo de cursos) sem
mockup, menor prioridade. Admin CRUD de trilhas (issue de Milestone 7) fica
para depois.
