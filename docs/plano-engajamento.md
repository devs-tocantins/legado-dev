# Plano — Engajamento, registro de esforço variável e redesign

> Status: **proposta** (não implementado). Documento para discussão antes de
> decidir o que e quando construir.

## Contexto

A comunidade cadastrou, testou e parou de usar. O dono não tem dinheiro para
prêmios e ainda está construindo confiança. Ele vai continuar insistindo
manualmente (posts no LinkedIn, "enchendo o saco") para conseguir 2-3 usuários
ativos — e o sistema precisa recompensar esse esforço, não desperdiçá-lo.

**Reframe importante (baseado em pesquisa sobre comunidades de voluntários/open
source):** dinheiro não é o que falta — pior, introduzir dinheiro tende a
_prejudicar_ o engajamento de longo prazo (efeito "crowding-out": mata a
motivação intrínseca). O que move dev em comunidade é **portfólio/prova de
trabalho, reconhecimento público e pertencimento**. É exatamente isso que um
sistema desses fabrica, e é o que os posts no LinkedIn já exploram sem querer.

Este plano NÃO promete "resolver o engajamento" — isso é um problema social e
iterativo. Ele faz três apostas fundamentadas: (1) reduzir a fricção de
registrar a quase zero, (2) transformar cada aprovação em reconhecimento público
compartilhável, e (3) deixar as telas onde isso acontece agradáveis de usar.
Instrumentamos e ajustamos.

Decisões já confirmadas com o dono:
- Esforço declarado em **faixas simples (Pequeno / Médio / Grande / Épico)** —
  padrão "tamanho de camiseta", não escala 1–10.
- Doação via **PIX** (link/QR, sem processar pagamento no sistema).
- Redesign visual **focado primeiro nas telas de atividade/missão**.

Como o modelo de dados já existe hoje (essencial para o plano):
- `Activity` tem `fixedReward` (XP fixo) — `api-engajamento/src/activities/domain/activity.ts`.
- Cada `Submission` **já guarda seu próprio `awardedXp`** — hoje é só uma cópia
  de `fixedReward` na aprovação. Toda a lógica de crédito de XP está em
  `api-engajamento/src/submissions/submissions.service.ts` (`review()`, ~linhas 205-245).
- Já existem: perfil público `/u/[username]`, rota de imagem `/api/og`,
  `gratitudeTokens` (reconhecimento par-a-par), badges, notificações e canal
  WhatsApp. Vamos **reaproveitar**, não recriar.

---

## Fase 1 — Registro de esforço variável (a dor mais concreta)

Objetivo: a mesma atividade pode valer XP diferente conforme o esforço, e o
usuário escolhe a faixa em 1 toque, com um exemplo que o ajuda a se calibrar.

### Backend (`api-engajamento`)
- **`Activity`**: adicionar coluna opcional `effortTiers` (JSON, nullable). Cada
  tier: `{ level: 'P'|'M'|'G'|'EPICO', label, example, xp }`. Se `null` → mantém
  o comportamento atual de `fixedReward` (100% retrocompatível, nada quebra).
  Migration nova + campo na entity/domain/DTOs de create/update activity.
- **Faixa de exibição**: derivar `minReward`/`maxReward` do `effortTiers` para o
  card mostrar "40–400 XP" quando for por esforço.
- **`CreateSubmissionDto`**: adicionar `effortLevel?` (enum P/M/G/EPICO) e, para
  atividade livre, `customTitle?` — `src/submissions/dto/create-submission.dto.ts`.
- **`Submission` entity/domain**: guardar `declaredEffort` e `customTitle`.
- **`ReviewSubmissionDto`**: adicionar `effortLevel?` (override do moderador) —
  ele confirma ou ajusta a faixa ao aprovar — `src/submissions/dto/review-submission.dto.ts`.
- **`submissions.service.ts` `review()`**: `awardedXp` passa a vir do tier
  efetivo (override do moderador → senão faixa declarada → senão `fixedReward`).
  Isso mantém a **confiança/anti-inflação**: o usuário se autodeclara, mas o XP
  final é você quem confirma na moderação (numa comunidade pequena isso é ótimo —
  cada submissão vira um ponto de contato). Atualizar notificação/transação para
  usar o XP efetivo.
- Atualizar specs de submissions/activities que hoje checam `fixedReward`.

### Atividade livre ("registrar outra atividade")
- Adicionar `isFreeform: boolean` em `Activity`. Um único card semente
  "Registrar outra atividade" onde o usuário informa `customTitle` + descrição +
  faixa de esforço + comprovante. Vai pra moderação como qualquer submissão; XP
  final definido por você. Cobre o "manda a atividade que quiser" sem inventar um
  fluxo novo.

### Frontend (`front-engajamento`) — tipos e serviços
- Estender os tipos de `Activity`/`Submission` e o form de submissão para enviar
  `effortLevel`/`customTitle`. Serviços em `src/services/api/services/`.

---

## Fase 2 — Redesign das telas de atividade/missão + fluxo de submissão

Foco confirmado: começar por aqui. Hoje `src/app/[language]/activities/page-content.tsx`
parece um "banco de dados": cartões iguais, densos, sem hierarquia nem calor.

Direção (reaproveitando a linguagem do hero: dark elegante + dourado `#E59B13`,
Tailwind + componentes `ui/` + framer-motion barato):
- **Cards de atividade**: hierarquia clara (título > recompensa > requisitos),
  ícone/categoria, recompensa como faixa ("40–400 XP") quando por esforço, chips
  de "cooldown"/"requer comprovante" mais leves, estados de vazio/loading
  decentes, micro-animação de entrada.
- **Seletor de esforço**: controle segmentado P/M/G/Épico que, ao focar cada
  faixa, mostra o exemplo ("PR de README" vs "arquitetura do zero") — o coração
  da usabilidade pedida. Precisa ser encantador e óbvio.
- **Fluxo de submissão**: virar uma folha/modal guiada (escolhe faixa → solta
  comprovante → descreve) em vez de formulário cru.
- **Missões**: mesma linguagem de card; "requisitos" e recompensa legíveis,
  status claro.
- Antes de codar, **entregar um mockup para aprovação** do visual, usando as
  skills de design (`design-system`, `design-critique`, `ux-copy`).

---

## Fase 3 — Amplificação de reconhecimento (a maior alavanca)

Aqui o esforço manual do dono vira funcionalidade e a pesquisa aponta o maior
retorno (capital social / portfólio).
- **Card de conquista compartilhável**: ao aprovar uma submissão, gerar uma
  imagem de conquista (via `/api/og`, que **já existe**) para o dono e o
  contribuidor postarem no LinkedIn marcando a pessoa.
- **Perfil público como portfólio**: `/u/[username]` já existe — reforçar como
  "prova de trabalho" fácil de compartilhar.
- **Prova social na home**: já há `LatestActivitySection` — semear com atividade
  real (a do dono + primeiros usuários) para a tela não parecer vazia.
- **Nudge value-first via WhatsApp** (canal pronto, opt-in): "aprovado / subiu no
  ranking" — reengajamento sem spam.

---

## Fase 4 — Apoiar o projeto (PIX)

- Nova página `/apoiar`: explica o porquê (custo de servidor, manter no ar) e
  mostra **chave PIX + QR + copia-e-cola**, com nota de transparência. Sem
  processar pagamento no sistema.
- Entrada discreta (rodapé + item de menu), nunca intrusiva.
- Opcional: badge/mural de "Apoiadores" — amarra a doação na economia de
  reconhecimento, sem fazer o dinheiro virar o motor.

---

## Prioridade sugerida

1. **Fase 1 + Fase 2** juntas (o "registrar melhor" — a dor imediata).
2. **Fase 3** (reconhecimento — maior alavanca, baixo custo por reusar `/api/og`).
3. **Fase 4** (PIX) — rápida e independente.
4. Instrumentar (submissões/semana, usuários ativos) e iterar. Não é one-shot.

## Arquivos críticos
- Backend: `activities/` (domain/dto/entity + migration nova), `submissions/`
  (dtos, entity, `submissions.service.ts`), specs correspondentes.
- Frontend: `app/[language]/activities/page-content.tsx`, fluxo/form de
  submissão, `app/[language]/missions/*`, `app/[language]/moderation/*` (override
  de faixa), tipos/serviços em `src/services/api/`, nova página `/apoiar`,
  `src/app/api/og` (card de conquista).

## Verificação (quando for implementar)
- Backend: migration local (banco local, nunca produção), lint/build/testes;
  `curl` criando atividade com `effortTiers`, submetendo com `effortLevel`,
  aprovando com override e conferindo `awardedXp` + transação corretos.
- Frontend: dev (`-p 3001`) contra backend local; testar no navegador o seletor
  de esforço, a submissão livre, o card `/api/og` e a página `/apoiar`; conferir
  responsivo e tema claro/escuro.
- Retrocompatibilidade: atividades sem `effortTiers` continuam creditando
  `fixedReward` (rodar um fluxo antigo para garantir que nada quebrou).
- Aprovação do mockup de design antes de implementar a Fase 2.

---

# Trilhas de aprendizado (brainstorm em aberto)

> Ideia grande, ainda em brainstorm. NÃO é plano de execução — é o registro do
> raciocínio e das decisões conforme a gente fecha. O plano de transição/migração
> vem depois, num documento próprio.

## A virada de proposta de valor

Hoje o sistema pede *"faça trabalho voluntário e ganhe ponto"* (tira valor da
pessoa). A trilha oferece *"a gente te dá o mapa mastigado pra evoluir na
carreira"* (dá valor antes de pedir qualquer coisa). O verdadeiro ganho do
usuário passa a ser **um caminho guiado até títulos de prontidão** (pronto pra
estagiar, júnior...), com **prova de trabalho verificável**. A gamificação vira
bônus, não a razão de existir. O voluntariado deixa de ser o centro e vira
consequência de uma comunidade que a pessoa já quer frequentar porque **ganha**
ali.

**Diferencial vs. plataformas grandes:** roadmap.sh guia mas não acompanha nem
exige prova; as plataformas grandes provam com quiz (fácil de burlar). O que
ninguém junta bem — e é a nossa arma — é **roadmap opinativo + prova por trabalho
real verificada por gente de verdade (a comunidade)**.

## Decisões já fechadas

- **Formato:** linear estilo Duolingo, com **test-out** — quem já sabe "prova" e
  pula o marco. Mecanicamente, test-out = fazer direto a prova final do marco,
  sem passar pelos passos de aprendizado.
- **Validação:** feita pelos **moderadores** (papel que já existe no sistema).
  Cada marco terá um **checklist de critérios de aceitação** para os moderadores
  julgarem de forma consistente (e para treinar moderador novo).
- **Títulos:** nomenclatura **própria por trilha** (ex.: níveis/medalhas). A
  tradução para "pronto pra estagiar / júnior" é **informal** (grupo do WhatsApp),
  sempre **humilde** — "você tem base pra *tentar* uma vaga júnior", nunca um
  veredito. **Não certificar "sênior"** (campo minado de credibilidade).
- **Primeiras trilhas:** **Backend inicial** e **Frontend inicial**, ambas indo
  até o nível que informalmente chamaremos de **"pronto para estagiar"**.
- **Guiar, não ensinar:** a gente só **aponta** recursos gratuitos e pede prova.
  Nunca produz conteúdo próprio (evita custo, manutenção e direito autoral).

## Duas moedas (separar crescimento pessoal de voluntariado)

Resolve o desconforto de "ganhar ponto fazendo coisa pra si mesmo":
- **XP de Jornada** (novo): progresso pessoal na trilha. É um **medidor**, não
  moeda — **não é gastável nem transferível**. Define o nível da trilha.
- **Reputação / Karma:** contribuição à comunidade (voluntariado). Alimenta o
  **ranking**. Para evitar dor de migração, o **XP atual vira Karma** (já vem
  quase todo de voluntariado); o XP de Jornada é um ledger novo.

## Loop que une as duas moedas (mentoria emergente)

O passo "agora prova" (ex.: um PR) é **revisado por um moderador/membro mais
experiente**: o aprendiz ganha **XP de Jornada** (evoluiu) e o revisor ganha
**Karma** (ajudou). Uma ação, as duas economias giram, e cria a **conexão
humana** que retém as pessoas — mentoria sem precisar organizar mentoria.

## Credencial verificável ("olha, aqui prova que sou júnior")

- **MVP (agora):** o **perfil público `/u/[username]` já existe e vira a
  credencial** — uma URL compartilhável com os marcos concluídos + as evidências
  (PRs, projetos). A pessoa põe no LinkedIn; o recrutador clica e vê a prova
  hospedada pela legado.dev. Zero dependência externa.
- **Depois (portabilidade):** emitir **Open Badges** (padrão aberto de credencial
  digital com metadados + verificação; base do Credly/AWS/IBM) para integrar
  nativo com o LinkedIn. Dá pra usar ferramenta de free-tier (Canvas
  Credentials/Badgr) ou implementar o padrão, sem Credly pago.

## Conteúdo dos marcos: recursos gratuitos para apontar

- **Mapas:** roadmap.sh.
- **Fundamentos:** freeCodeCamp, The Odin Project, CS50, Full Stack Open.
- **Provar fazendo:** Exercism (grátis, com mentor voluntário), Codewars,
  Frontend Mentor, issues reais (goodfirstissue, up-for-grabs).
- **Cloud (grátis, certificação às vezes grátis em eventos):** Microsoft Learn,
  Google Cloud Skills Boost, AWS Skill Builder.
- **QA (trilha futura):** Test Automation University (grátis), Ministry of
  Testing, syllabus ISTQB.
- **Inglês (sem ensinar, só tarefas):** dev talks sem legenda, ler docs em
  inglês, abrir PR/issue em inglês, language exchange (Tandem/HelloTalk).
- **Networking/eventos:** **o módulo de eventos já existe** — "comparecer",
  "fazer uma pergunta", "conectar 3 pessoas no LinkedIn" viram marcos de graça.

## Catálogo de cursos (comunitário)

- Usuário cadastra curso que fez (valor, avaliação) e pede comprovante de
  conclusão. **Anti-spam/affiliate:** curso só aparece "verificado" após N
  conclusões reais; avaliação atrelada a quem provou conclusão.
- **Peso da prova:** certificado de conclusão vale **pouco** XP (só assistiu
  vídeo); o **"prove fazendo"** (PR, projeto) vale o grosso.

## Escala pela comunidade (o "dessa vez vão me ajudar")

Membros avançados **propõem trilhas/marcos/cursos** (moderados antes de publicar)
e viram **"mantenedores" daquela trilha** — papel de status/reconhecimento que
rende Karma. Contribuir com a trilha é, ele mesmo, um trabalho voluntário. Você
vira **curador**, não autor único. É assim que roadmap.sh e Exercism escalam.

## Princípio de design que protege tudo

**Sempre um próximo passo óbvio e pequeno.** O que mata o sistema atual é a tela
vazia ("e agora?"). O poder do Duolingo não é o mapa — é que ao logar há **UMA**
ação clara na frente. Todo o design da trilha deve girar em torno disso.

## Migração é aditiva, não reescrita

Nada é jogado fora. A trilha é uma **camada de orquestração** sobre o que já
existe: marco = submissão+comprovante (existe), validação = moderação (existe),
selo de nível = badge (existe), networking = eventos (existe). O que é
genuinamente novo: (a) modelo de dados de trilha/marco (ordem, pré-requisitos) e
(b) o segundo ledger (XP de Jornada). Dá pra migrar **uma trilha por vez** com o
resto intacto. O catálogo de atividades atual coexiste e vira "provas avulsas"
plugáveis em trilhas.

## Como a trilha é criada e editada (arquitetura) — DECIDIDO

- **Modelo mora no banco desde o dia 1** (como atividade/missão/badge já moram).
  Separar sempre duas coisas: *onde a trilha mora* (banco) x *como se edita*
  (autoria).
- **Fase A — autoria por seed/migration (arquivo versionado no git).** As duas
  primeiras trilhas nascem no banco, escritas por você em arquivo estruturado. O
  sistema já consome do banco; o modelo "de verdade" já está de pé. Rápido de
  validar, sem construir CMS.
- **Fase B — admin CRUD por cima do mesmo modelo, sob demanda.** Quando um
  mantenedor não-dev precisar autorar, aí se constrói a tela. Como já é DB, é
  aditivo (só endpoints de escrita + UI), sem migração.
- **A VM Oracle não limita essa decisão:** definição de trilha é texto/links
  (kilobytes); o Postgres que já roda aí serve isso sem esforço. O medo de VM
  vale pra features pesadas (mídia, tráfego), não pra currículo.
- **Edição não-destrutiva (obrigatório):** marco publicado **nunca é apagado** —
  só **arquivado** (soft-delete/status). Isso protege quem já concluiu e quem
  está no meio.

## Suporte a quem está no meio da trilha — DECIDIDO (princípio)

O que protege quem está no meio **não** é a estrutura de ordenação em si, e sim
**desacoplar o progresso do usuário da estrutura da trilha**:
- Progresso = **registros de conclusão por ID de item** (tabela de junção
  usuário × item). Reordenar, inserir ou arquivar itens **não toca** nesses
  registros.
- A "posição atual" do usuário é **derivada**: o primeiro item ativo que ele
  ainda não concluiu. Assim, editar a trilha só muda qual é o *próximo passo*,
  nunca corrompe o histórico.
- **Ordenação — DECIDIDO: índice fracionário + soft-delete** (padrão fractional
  indexing / LexoRank, usado por Trello/Jira/Notion), **não** lista encadeada.
  Cada marco tem uma `posição` numérica; inserir entre A(2.0) e B(3.0) = dar
  posição 2.5, sem tocar em ninguém. Lê em ordem com `ORDER BY posicao`,
  impossível criar ciclo. Substituir = arquivar o antigo + criar o novo. Descartada
  a lista encadeada por exigir recursão pra ler em ordem e ser propensa a ciclo.

## Tipos de item da trilha (em aberto — brainstorm)

Uma trilha tem **etapas/seções** (agrupadores) e, dentro delas, **itens**.
Candidatos a tipo de item:
- **Recurso/Leitura:** link curado (curso, artigo, vídeo, seção do roadmap.sh)
  para consumir. Marcar como feito é auto-declarado, sem prova.
- **Marco de prova ("prove fazendo"):** descreve a tarefa; usuário envia
  comprovante; moderador valida. Reusa submissão+moderação.
- **Comprovação de curso:** anexa certificado de um curso do catálogo
  (especialização de "prova", peso baixo de XP).
- **Checkpoint/quiz/autoavaliação:** teste curto, possivelmente auto-corrigido
  (sem moderador) — habilita test-out barato.
- **Marco de evento/networking:** reusa o módulo de eventos (comparecer, fazer
  pergunta, conectar N pessoas).
- **Marco de missão:** pluga uma missão existente como item.
- **Bloco de texto/instrução:** conteúdo inline (dica estilo Duolingo) — pode ser
  só o corpo de um item, não um tipo separado.

**Modelagem provável:** uma tabela `track_item` com discriminador `type` + campos
compartilhados + JSON de config específico, **referenciando por FK** entidades
reutilizáveis (curso, atividade, missão, evento) em vez de duplicá-las. Catálogo
de cursos e tabela de progresso são tabelas próprias. Evitar "uma tabela por
tipo" no começo.

## Modelo de dados (rascunho, ainda no papel)

Padrão da casa: PK `uuid`, FK via `@ManyToOne`+`@JoinColumn`, enums TypeORM,
`EntityRelationalHelper`, `createdAt`/`updatedAt`. Reusa entidades existentes
(`submission`, `activity`, `mission`, `event`, `badge`, `gamification_profile`).

**`learning_track`** — a trilha.
- `id` uuid; `slug` unique (ex.: `backend-inicial`); `title`; `description`;
  `area` (ex.: backend/frontend); `status` (draft/published/archived).
- **Achado do design (mockup "Trilhas — Catálogo", direção 2A "Construtor"):**
  trilhas têm um **tier** (`alicerce`/`pilar`/`arco` — aproximadamente
  estagiar/júnior/pleno) e podem exigir **outra trilha concluída como
  pré-requisito** para desbloquear (ex.: "DevOps essencial" só abre após
  "Backend inicial"; "Full-stack pleno" exige nível Júnior). Campos a adicionar:
  `tier` enum e `requiresTrackId?` FK (self-reference) — **ainda não
  implementado**, é gap descoberto no design, não estava no modelo original.

**`track_section`** — etapa/agrupador; também funciona como "nível".
- `id`; `trackId` FK; `title` (ex.: "Fundamentos"); `description?`;
  `position` float (índice fracionário); `status` (active/archived);
  `badgeId?` FK → `badge` (o **selo/título** concedido ao concluir a etapa —
  é aqui que mora o "pronto pra estagiar", reusando o sistema de badges).

**`track_item`** — item da trilha (tabela única, discriminada).
- `id`; `trackId` FK; `sectionId` FK; `type` enum (RESOURCE, TEXT, PROOF,
  COURSE_COMPLETION, EVENT, MISSION, CHECKPOINT); `title`; `body?` (instrução/
  texto inline); `position` float; `status` (active/archived — **soft-delete**);
  `isOptional` bool; `allowsTestOut` bool; `journeyXp` int (XP de Jornada ao
  concluir; prova pesa alto, recurso pesa baixo); `config` jsonb (específico do
  tipo: URL do recurso, perguntas do quiz, checklist de aceitação, regra de
  evento); FKs opcionais conforme o tipo: `activityId?`, `missionId?`,
  `courseId?` (referência, não duplica).

**`course`** — catálogo de cursos, reutilizável entre trilhas.
- `id`; `title`; `provider?`; `url`; `isFree` bool; `price?`; `language?`;
  `submittedByProfileId?` FK (quem cadastrou); `status` (pending/verified/
  rejected — verificado após N conclusões/moderação, anti-spam).

**`course_review`** — avaliação de curso.
- `id`; `courseId` FK; `profileId` FK; `rating` (1–5); `comment?`;
  `provenCompletion` bool (atrelada a quem provou conclusão); unique
  (`courseId`,`profileId`).

**`track_enrollment`** — a pessoa entrou na trilha.
- `id`; `trackId` FK; `profileId` FK; `status` (active/completed/abandoned);
  `startedAt`/`completedAt`; unique (`trackId`,`profileId`).

**`track_item_completion`** — progresso (o coração do "mid-track seguro").
- `id`; `itemId` FK; `profileId` FK; `status` (completed/skipped_testout/
  in_review); `submissionId?` FK → `submission` (quando a prova passou pela
  moderação); `awardedJourneyXp` int; `completedAt`; unique (`itemId`,`profileId`).

### Derivações e integrações
- **Posição atual do usuário** = primeiro `track_item` `active` da trilha (ordem:
  `section.position`, depois `item.position`) sem `completion` para aquele
  profile. Editar a trilha nunca corrompe progresso — só muda o próximo passo.
- **Reuso da moderação:** item `PROOF` aponta para uma `activity` (normal ou
  freeform). Concluir = criar `submission`; ao aprovar na moderação já existente,
  gera-se o `track_item_completion` com o `submissionId`. O checklist de
  aceitação fica no `track_item.config` pra o moderador ver.
- **Itens automáticos:** `RESOURCE`/`TEXT` = conclusão auto-declarada (XP baixo,
  sem moderação); `CHECKPOINT`/quiz = auto-corrigido pelo `config` (habilita
  test-out sem humano); `EVENT`/`MISSION` = reusam inscrição em evento / missão.
- **Duas moedas:** somar XP de Jornada em `gamification_profile.journeyXp`
  (coluna denormalizada nova, tipo o `totalXp`), tendo as `completion` como fonte
  de verdade. O XP atual (`totalXp`/mensal/anual) passa a ser lido como **Karma**
  — sem mudança de dados, só de leitura/rótulo.

> Nota de terminologia: "Karma" é só um **nome proposto** para a moeda de
> comunidade (o XP que já existe hoje, vindo de voluntariado). Não há nada com
> esse nome no sistema — pode virar "Reputação" / "XP da Comunidade".

### Design da experiência (Claude Design — aprovado)

- Projeto "Trilhas de aprendizado legado.dev" no Claude Design, arquivo
  `Trilhas - Catálogo.dc.html`. Direção escolhida e desenvolvida em 6 telas:
  **2A Construtor** (hub/catálogo), **3A** (dentro da trilha), **4A** (cumprir
  marco), **5A** (conquista do selo), **6A** (perfil público), **7A** (validar
  prova — extensão da moderação existente, não novo papel). Detalhe tela a tela
  e mapeamento pra issues em `plano-desenvolvimento-trilhas.md` (Milestone 6).
- **Achado do design — "meta da semana":** widget no hub mostrando quantos
  marcos a pessoa concluiu nos últimos 7 dias (ex.: "3/5"). Provavelmente
  **calculável on-the-fly** a partir de `track_item_completion.completedAt`
  (sem tabela nova) — só contar completions da semana corrente por profile.
- **Achado do design — tier/pré-requisito entre trilhas:** ver nota em
  `learning_track` acima (`tier`, `requiresTrackId?`).
- **Decisão confirmada:** validação continua **só por moderador** (papel já
  existente) — a tela "validar prova" do design é uma view a mais dentro da
  moderação atual, o número de reputação ali é só informativo.

### Perguntas em aberto do modelo
- **Que moeda um marco credita? (direção provável, NÃO fechada):** padrão =
  **só XP de Jornada** (crescimento pessoal). Um marco pode ter um flag opcional
  `grantsCommunityXp` que credita **também** a moeda de comunidade quando ele é
  contribuição real (ex.: **PR para o próprio legado.dev**, revisar trabalho de
  outro, organizar evento). Só esses poucos marcos são marcados — não precisa
  retrofitar todas as atividades. Um campo por marco, sem dor. *Ainda maturando.*
- Ideia forte a validar: incluir "contribua com o próprio legado.dev" como marco
  — prova de skill real + contribuição genuína + canaliza aprendizes pra ajudar a
  plataforma (loop de mentoria fechando com o legado.dev no meio).
- Título/nível é sempre via `badge` (recomendado) ou precisa de entidade de nível
  própria em algum caso?
- `submission` ganha um `trackItemId?` opcional para o fluxo de aprovação saber
  creditar Jornada em vez de Karma — confirmar esse ponto de integração.

## Trilhas futuras (não agora)

QA, soft skills, networking/eventos, inglês. A trilha vai mudando conforme o
pessoal usa e dá feedback.

## Ideias futuras — perfil público (não priorizado ainda)

- **Certificado gerado para o usuário**: depois que o perfil público (`/u/:username`)
  mostrar o progresso por trilha organizado em cards (XP, marcos concluídos,
  selos), avaliar gerar um certificado (PDF ou imagem) por trilha concluída —
  reaproveitando o `/api/og` existente como base de layout. Ainda não desenhado,
  só registrado aqui para não perder a ideia.

## Perguntas em aberto

- Modelo de dados de trilha/marco/pré-requisito e como o test-out se encaixa.
- Como exatamente o XP de Jornada mapeia para níveis/títulos de cada trilha.
- Regras de consistência entre moderadores (formato do checklist de aceitação).
- Quando (e se) partir de perfil-como-credencial para Open Badges de verdade.
- Sequência de transição do sistema atual → sistema com trilhas (doc próprio).

---

## Fundamentação (por que essas apostas)

Pesquisa sobre comunidades de voluntários / open source:
- [Money and Open Source Communities — Open Collective](https://blog.opencollective.com/money-and-open-source-communities/)
- [10 Open Source Badge Platforms — daily.dev](https://daily.dev/blog/10-open-source-badge-platforms-for-community-managers/)
- [What is Success for Open Source Contributors? (arXiv)](https://arxiv.org/pdf/2105.08789)
