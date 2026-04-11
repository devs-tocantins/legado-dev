# Plano de Implementação do Design — Legado Tech Frontend

> **Como funciona este documento:**
> O trabalho está dividido em **Etapas** sequenciais. Cada etapa deve ser implementada, revisada e **autorizada** antes do início da próxima. Algumas etapas podem ser desenvolvidas em paralelo (indicado), mas a regra geral é: uma etapa por vez.
>
> **Por que etapas?** Cada etapa entrega algo visível e testável. Isso evita um retrabalho gigante no final e permite ajustes incrementais enquanto o custo de mudança ainda é baixo.

---

## Estado Atual do Frontend (Diagnóstico)

Antes de qualquer mudança, aqui está o que existe hoje e o que precisa mudar:

| Área | Estado Atual | O que está errado |
|---|---|---|
| **Cores** | Shadcn defaults (preto/branco absolutos, azul genérico) | Sem identidade de produto, sem calor |
| **Tipografia** | System font (Roboto do MUI + padrão) | Sem personalidade, números não são monospace |
| **Landing Page** | Hero com degradê (navy + gradient orbs + gradient text) | Viola os anti-padrões do manual: gradiente em tudo |
| **Dashboard** | Cards com ícone colorido em fundo colorido | Padrão de template mais genérico possível |
| **Leaderboard** | Pódio com `bg-gradient-to-b` nos cards | Degradê exatamente onde não deve ter |
| **AppBar** | Ícone Zap como logo, hambúrguer no mobile | Logo provisório, mobile sem bottom nav |
| **Perfil Público** | Sem capa, sem badges, sem botão de compartilhar | Incompleto para o propósito de "currículo" |
| **Formulários** | Mix de MUI e shadcn | Inconsistência visual e de DX |
| **Empty States** | Inconsistentes entre páginas | Sem padrão definido |
| **Skeletons** | Alguns existem, sem padrão | Inconsistentes |

---

## ETAPA 0 — Fundação: Tokens de Design e Tipografia

> **Impacto:** Altíssimo. Esta etapa não muda nenhum componente visível diretamente, mas como todos os componentes herdam CSS custom properties e classes do Tailwind, mudar os tokens aqui afeta o sistema inteiro.
> **Risco:** Baixo. São apenas mudanças em CSS e configuração de fonte.
> **Arquivos tocados:** `globals.css`, `layout.tsx`

### 0.1 — Atualizar globals.css com a nova paleta

Substituir os tokens de cor do shadcn pelos tokens do design manual:
- Background light: `oklch(0.975 0.005 80)` (off-white quente, não branco puro)
- Background dark: `oklch(0.135 0.008 145)` (quase preto com toque orgânico)
- Primary: azul Tocantins (ajustado de `oklch(0.52 0.22 230)` para `oklch(0.48 0.22 265)`)
- Accent (âmbar dourado): novo token `--accent: oklch(0.64 0.18 70)` no light
- Surface e surface-raised: novos tokens para profundidade sem sombra
- Cores de borda com toque levemente quente

### 0.2 — Configurar fontes via next/font

Em `layout.tsx`, configurar:
- `Space_Grotesk` — heading (`subsets: ['latin']`, `weights: [400, 500, 600, 700]`)
- `Inter` — body (`subsets: ['latin']`, `weights: [400, 500, 600]`)
- `JetBrains_Mono` — números/código (`subsets: ['latin']`, `weights: [400, 500, 600, 700]`)

Expor as três via CSS variables e mapear no Tailwind theme:
- `--font-sans` → Inter
- `--font-heading` → Space Grotesk
- `--font-mono` → JetBrains Mono

### 0.3 — Criar classes utilitárias

No `globals.css`, adicionar:
- `.font-heading` → `font-family: var(--font-heading)`
- `.font-mono` → `font-family: var(--font-mono)` (já existe, mas garantir mapeamento)
- `.tabular-nums` → `font-variant-numeric: tabular-nums`

### Critério de Conclusão da Etapa 0
- [ ] Visitar `/` e `/dashboard` — os fundos não são mais branco puro nem preto puro
- [ ] Qualquer texto de heading usa Space Grotesk
- [ ] Números de XP existentes ficam em JetBrains Mono (via `font-mono` onde aplicado)
- [ ] Toggle de tema light/dark funciona com ambas as paletas
- [ ] Nenhum componente quebrou visualmente (apenas mudanças sutis de cor)

**Aguardar autorização para Etapa 1.**

---

## ETAPA 1 — AppBar e Navegação

> **Impacto:** Alto — a navegação aparece em todas as páginas.
> **Risco:** Médio — mobile bottom nav é novo componente.
> **Arquivos tocados:** `src/components/app-bar.tsx`, novo `src/components/bottom-nav.tsx`

### 1.1 — AppBar Desktop

- Substituir o ícone `Zap` por um placeholder de logo digno: iniciais "DT" em Space Grotesk bold, num quadrado com borda `--primary` e background `--primary/10`. Isso será substituído pelo SVG real quando estiver disponível.
- Ajustar o backdrop: `bg-background/80 backdrop-blur-md` (já existe, manter)
- Nav links: aplicar `font-heading` (Space Grotesk) em `font-medium`, ajustar cores para usar os novos tokens
- Estado ativo: remover `bg-primary/10` e usar apenas `text-primary` + `border-b-2 border-primary` (underline sutil, como tabs)
- Remover o `ChevronDown` do trigger do avatar (elemento desnecessário)

### 1.2 — Dropdown de Usuário

- Mostrar `@username` do `GamificationProfile` no dropdown (atualmente só mostra o e-mail)
- Adicionar: avatar + nome + @username + nível atual (pequeno, na cor do nível) no topo do dropdown
- Reorganizar itens: Perfil Público → Dashboard → separador → Configurações → Sair

### 1.3 — Bottom Navigation (Mobile)

Criar `src/components/bottom-nav.tsx`:
- Fixado na base da tela (`fixed bottom-0`)
- Altura: 56px + safe-area-inset-bottom para iOS
- 4 tabs: Home/Dashboard | Atividades | Ranking | Perfil
- Ícones centralizados + label pequeno abaixo
- Tab ativa: ícone em `--primary`, label em `--primary`
- Fundo: `bg-background/95 backdrop-blur-md` + borda topo `border-t border-border/50`
- Visível apenas em viewport `< md` (a AppBar desktop mantém-se acima de md)
- Para usuários não autenticados: Home | Atividades | Ranking | Entrar

### 1.4 — Padding da Página em Mobile

Adicionar `pb-16` (64px) ao container do layout em mobile para compensar a bottom nav.

### Critério de Conclusão da Etapa 1
- [ ] Desktop: nav links com underline no ativo, sem fundo preenchido
- [ ] Logo placeholder com iniciais "DT" digno
- [ ] Dropdown mostra @username e nível do usuário
- [ ] Mobile: bottom nav visível com 4 tabs funcionais
- [ ] Mobile: conteúdo não fica atrás da bottom nav

**Aguardar autorização para Etapa 2.**

---

## ETAPA 2 — Dashboard

> **Impacto:** Alto — é a primeira tela que o membro vê após login.
> **Risco:** Baixo — apenas layout e estilo, sem mudança de lógica de negócio.
> **Arquivos tocados:** `dashboard/page-content.tsx`

### 2.1 — Header da Página

- Remover o "Olá, {nome}!" genérico
- Substituir por: `@username` em `font-heading text-xl` + nível em badge colorida ao lado
- Subtítulo: "Seu legado na Devs Tocantins" (imutável, não personalizado)
- Canto direito: botão "Ver meu perfil público" (link para `/u/:username`) com ícone `Share2`

### 2.2 — Cards de Stat

**Remover o padrão atual** (ícone com fundo colorido + número + label):

**Novo padrão:**
```
┌─────────────────────────────┐
│ XP TOTAL              label │  ← label em body-sm uppercase muted tracking-wide
│                             │
│ 1.337k                      │  ← valor em stat-lg JetBrains Mono, foreground
│                             │
│ ↑ +250 XP neste mês        │  ← contexto em body-sm success ou muted
└─────────────────────────────┘
```

- Sem ícone com fundo colorido
- O card de XP Total é ligeiramente maior que os outros (talvez `col-span-2` em desktop ou maior padding)
- Card de Tokens: exibir `X de 5 tokens disponíveis` + data de expiração em `warning` se ≤ 3 dias

### 2.3 — Barra de Progresso de Nível

- Cor da barra = cor do nível atual (não usar sempre `bg-primary`)
- Animação Framer Motion: ao carregar, preenche da esquerda para direita em 0.6s
- Texto: `[NívelAtual] → [PróximoNível]` com `X XP restantes` à direita
- Se nível máximo: exibir mensagem especial "Você alcançou o nível máximo. Lenda."

### 2.4 — Submissões Recentes

- Formato feed (não lista simples):
  - Cada item tem: ícone de status (colorido semanticamente) + nome da atividade + data relativa ("há 2 dias") + XP/status
  - Status PENDING: ícone `Clock` em amber, texto "Aguardando revisão"
  - Status APPROVED: ícone `CheckCircle2` em success, texto `+XX XP` em JetBrains Mono success
  - Status REJECTED: ícone `XCircle` em danger, texto "Ver feedback" (link)
- Skeleton: 5 linhas com mesmo formato

### 2.5 — Ações Rápidas

- Layout: grid 2×3 em mobile, flex row em desktop
- Cada ação: card compacto com ícone centralizado + label, sem botão convencional
- Hover: `translateY(-2px)` + borda `--primary/30`
- A ação "Submeter Atividade" tem destaque visual maior (card de cor primary/5 com borda primary/20)

### 2.6 — Dialog de Envio de Token (melhoria pendente)

**Problema:** O campo "ID do Perfil Destinatário" não é utilizável — nenhum usuário sabe o UUID de outro.

**Solução:** Substituir por um Combobox de busca de perfil:
- Campo de texto com debounce (300ms) que chama `GET /api/v1/gamification-profiles?search=<termo>`
- Resultados mostram `@username` + nome completo (se disponível) em um dropdown
- Ao selecionar, guarda internamente o `profileId` (invisível ao usuário)
- Fallback: se a busca retornar vazio, exibe "Nenhum perfil encontrado"

> **Dependência de backend:** A rota `GET /gamification-profiles` precisa aceitar o parâmetro `?search=` para filtrar por `username` ou nome. Ver nota em `api-engajamento/docs/user-stories.md` (Melhoria US-22-B).

Esta melhoria deve ser implementada junto ou após a Etapa 7 (quando o Combobox de atividades for construído — reutilizar o mesmo padrão).

### Critério de Conclusão da Etapa 2
- [x] Nenhum ícone com fundo colorido nos cards de stat
- [x] XP em JetBrains Mono
- [x] Barra de progresso anima ao carregar
- [x] Status de submissões com ícones semânticos corretos
- [ ] Dialog de envio de token com Combobox de busca (pendente backend)

**Aguardar autorização para Etapa 3.**

---

## ETAPA 3 — Leaderboard

> **Impacto:** Alto — é a tela mais "pública" e visitada por não-membros.
> **Risco:** Baixo.
> **Arquivos tocados:** `leaderboard/page-content.tsx`

### 3.1 — Pódio (Top 3)

Remover os `bg-gradient-to-b` completamente.

**Novo design do pódio:**
- Três cards com **alturas CSS diferentes**: 1º = 240px, 2º = 200px, 3º = 192px
- Alinhados na base (não no topo) — `items-end` no grid
- Cada card: fundo `--surface`, borda lateral esquerda de 3px (a "faixa de medalha"):
  - 1º: `border-l-4 border-amber-400`
  - 2º: `border-l-4 border-slate-400`
  - 3º: `border-l-4 border-amber-700`
- Avatar circular 48px no topo do card
- Posição em `stat-md` JetBrains Mono
- @username em `font-heading font-semibold`
- XP em `stat-sm` JetBrains Mono âmbar (1º) / muted (2º e 3º)
- Nível em badge pequena com cor do nível
- Card do 1º lugar: borda `border-amber-400/40` com animação sutil `shimmer` na borda (Framer Motion keyframes)

### 3.2 — Tabela (4º em diante)

- Manter estrutura atual mas com ajustes visuais:
  - Linha do usuário logado: `bg-primary/5` + indicador `◀ Você` na coluna `#`
  - `@username` em JetBrains Mono com link para perfil
  - XP em `stat-sm` JetBrains Mono
  - Posição em `stat-sm` JetBrains Mono muted
  - Hover: `bg-surface-raised transition-colors duration-100`

### 3.3 — Tabs de Período

- Substituir os `button` simples por tabs com `underline indicator`:
  - Tab inativa: `text-foreground-muted border-b-2 border-transparent`
  - Tab ativa: `text-primary border-b-2 border-primary`
  - Transição do indicador: Framer Motion `layoutId="tab-indicator"` (desliza suavemente)

### 3.4 — Empty State e Loading

- Loading skeleton: blocos com alturas proporcionais ao pódio + 7 linhas de tabela
- Empty state: ícone `Trophy` grande + "O ranking ainda não tem dados. Seja o primeiro!"

### Critério de Conclusão da Etapa 3
- [ ] Pódio sem nenhum gradient
- [ ] Cards com alturas diferentes alinhados na base
- [ ] Borda lateral colorida por posição
- [ ] Usuário logado destacado na tabela
- [ ] Tabs com underline indicator animado

**Aguardar autorização para Etapa 4.**

---

## ETAPA 4 — Perfil Público `/u/:username`

> **Impacto:** Altíssimo — é o produto principal. É o que vai no LinkedIn.
> **Risco:** Médio — novos componentes (capa, badges, share button).
> **Arquivos tocados:** `u/[username]/page-content.tsx`

### 4.1 — Área de Capa

- Adicionar uma faixa de capa de `140px` de altura acima do header
- Por enquanto (sem foto real disponível): pattern CSS geométrico em SVG embutido
  - Grid de pontos muito finos em `--primary/8` sobre `--surface`
  - No dark: grade de linhas em `--primary/12` sobre `--surface`
- Estrutura da capa preparada para receber `<Image>` quando foto estiver disponível: `relative overflow-hidden`
- O avatar fica posicionado com `absolute bottom-0 translate-y-1/2 left-6` (sobreposto à borda da capa)

### 4.2 — Header do Perfil

- Avatar: 64px, circular, borda de 3px `--background` (para destacar sobre a capa)
- Se sem foto: iniciais em `font-heading font-bold`, cor derivada do hash do username, fundo derivado
- Abaixo do avatar: `@username` em `font-heading font-bold text-xl` JetBrains Mono
- Nome completo em `body-lg` muted (se disponível via API)
- Badge de nível ao lado do username: cor do nível + nome
- "Última contribuição: há X dias" em `body-sm` muted com ícone `Clock`
- Posição no ranking: `#7 no ranking geral` em `body-sm` com ícone `Trophy` amber
- Botão "Compartilhar Perfil" canto direito: `variant="outline"` com ícone `Share2`
  - Ao clicar: `navigator.clipboard.writeText(window.location.href)` + toast "Link copiado!"

### 4.3 — Stat Cards

- Mesmo padrão definido na Etapa 2 (sem ícone com fundo colorido)
- 4 cards: XP Total | XP Mês | XP Ano | Posição Global
- Cards de visitante (não o próprio perfil): omitir Tokens

### 4.4 — Seção de Badges

- Grid horizontal com `overflow-x-auto` em mobile, wrap em desktop
- Cada badge: quadrado `52×52px` com `radius-lg`, fundo `--accent-light`, ícone `Award` em âmbar
- Tooltip no hover: nome do badge + "Conquistado em DD/MM/YYYY"
- Se o perfil não tem badges: seção inteiramente omitida (sem "nenhum badge")
- Placeholder: componente `BadgePlaceholder` para quando arte real não está disponível

### 4.5 — Feed de Contribuições

- Substituir a lista plana por feed com separadores:
  - Cada item: círculo pequeno `--success` à esquerda (timeline visual) + nome da atividade em `body-md font-medium` + `+XX XP` em `stat-sm` mono success + data em `body-sm` muted
  - Linha vertical conectando os círculos (timeline)
- "Ver todas as contribuições" não é necessário nesta versão (sempre mostra as últimas 10)

### 4.6 — Meta Tags Open Graph

No `u/[username]/page.tsx` (server component):
```typescript
export async function generateMetadata({ params }) {
  // buscar perfil via API
  return {
    title: `@${username} — Legado Tech`,
    description: `${level} com ${xp} XP na comunidade Devs Tocantins`,
    openGraph: {
      title: `@${username} — Legado Tech`,
      description: `...',
      images: [{ url: `/api/og?username=${username}` }],
    }
  }
}
```

A rota `/api/og` será criada na Etapa 8 (depende do design estar estável).

### Critério de Conclusão da Etapa 4
- [ ] Faixa de capa com pattern CSS (sem foto ainda)
- [ ] Avatar com sobreposição na capa
- [ ] Botão de compartilhar funcional com clipboard + toast
- [ ] Seção de badges renderizando (mesmo sem arte real)
- [ ] Feed de contribuições no formato timeline
- [ ] Seção de badges omitida quando vazia

**Aguardar autorização para Etapa 5.**

---

## ETAPA 5 — Páginas de Autenticação

> **Impacto:** Médio-alto — é o ponto de entrada de novos membros.
> **Risco:** Baixo — sem mudança de lógica.
> **Arquivos tocados:** `sign-in/page-content.tsx`, `sign-up/page-content.tsx`

### 5.1 — Layout Split Screen

Criar um componente `AuthLayout` reutilizável:

```
┌──────────────────────┬──────────────────────┐
│  Coluna Esquerda     │  Coluna Direita       │
│  (hidden em mobile)  │  (100% em mobile)     │
│                      │                       │
│  Fundo escuro sempre │  bg-background        │
│  (independente tema) │                       │
│                      │  Logo pequeno         │
│  Pattern CSS ou foto │  Formulário           │
│  com overlay         │  centralizado         │
│                      │                       │
│  Quote de membro     │                       │
│  (hardcoded por ora) │                       │
└──────────────────────┴──────────────────────┘
```

### 5.2 — Coluna Esquerda

- Fundo: `#111411` fixo (não muda com o tema)
- Pattern: mesmo grid de pontos da capa do perfil, mas em branco com opacidade baixa
- Logo Devs Tocantins versão branca no topo (placeholder "DT" em branco)
- Quote hardcoded (até ter fotos e quotes reais):
  - Texto: *"Ajudei um júnior a configurar o ambiente em 40 minutos. Essa conversa virou pontos. Não sabia que contribuição tinha nome."*
  - Autor: `— @dev_tocantins, Colaborador Ativo`
  - Estilo: `font-heading italic text-white/60 text-sm`

### 5.3 — Formulários

- Todos os inputs: `radius-md`, label acima (não placeholder como label)
- Placeholder: apenas dica de formato, nunca o nome do campo
- Botão de submit: `w-full`, `height: 44px`, `font-heading font-semibold`
- Link "Ainda não tem conta? Cadastre-se" abaixo do formulário

### Critério de Conclusão da Etapa 5
- [ ] Split screen visível em desktop, coluna esquerda oculta em mobile
- [ ] Formulário centralizado na coluna direita
- [ ] Quote visível na coluna esquerda
- [ ] Labels acima dos inputs, não como placeholder

**Aguardar autorização para Etapa 6.**

---

## ETAPA 6 — Landing Page (Home)

> **Impacto:** Altíssimo — é o cartão de visitas da plataforma para não-membros.
> **Risco:** Alto — reescrita completa da página atual.
> **Arquivos tocados:** `[language]/page-content.tsx`

> **Nota:** A landing page atual tem trabalho interessante (constelações, animações), mas viola os anti-padrões do manual (degradê no hero, gradient text, orbs). A reescrita manterá as animações e a estrutura mas removerá os elementos proibidos.

### 6.1 — Seção Hero (Reescrita)

**Remover:**
- `CornerOrbs` (orbs de gradiente animados)
- O `linear-gradient(160deg, ${NAVY}...)` no fundo
- O gradient text em "Seja reconhecido."

**Manter/adaptar:**
- `EdgeConstellation` — manter, é sutil e interessante
- O parallax scroll (`heroY`, `heroOpacity`) — manter
- As animações de entrada (`fadeUp`, `staggerContainer`) — manter

**Novo hero:**
- Layout split `grid lg:grid-cols-2`
- Fundo: `--background` simples. A constelação fica apenas na metade esquerda de fundo.
- Coluna esquerda (texto):
  - Eyebrow: `DEVS TOCANTINS` em `label-sm` tracking-widest, cor `--accent`
  - Headline: 2-3 linhas, `font-heading` Space Grotesk, tamanho `clamp(2rem, 5vw, 3.5rem)`, cor `--foreground`
  - Headline sem gradient text
  - Subtítulo: `body-lg` muted
  - CTAs: botão primário + botão outline
- Coluna direita (card de ranking ao vivo):
  - Card com borda `--border`, `radius-xl`
  - Header: "🏆 Top 5 — Este Mês" com data atual
  - Lista dos 5 primeiros do ranking mensal (dados reais da API)
  - Cada linha: posição em mono + @username + nível + XP em mono amber
  - Footer: "Ver ranking completo →" (link)
  - O card mostra um skeleton enquanto carrega

### 6.2 — Seção Stats

- Manter a seção atual mas aplicar as novas fontes
- Números em `stat-xl` JetBrains Mono
- Labels em `label-sm` uppercase tracking-widest muted
- Cores: usar `--primary` e `--accent` em vez de constantes hardcoded

### 6.3 — Seção Features

- Manter o grid 3 colunas atual
- **Remover** o gradiente no `top-edge accent line` (a linha com `background: gradient`)
- Substituir por: borda topo sólida colorida `border-t-2 border-[accent-color]` que aparece no hover
- Manter o ícone com fundo colorido transparente (nesta seção é aceitável — é marketing, não UI de dado)

### 6.4 — Seção CTA Final

- **Remover** o `radial-gradient` de fundo
- Substituir por: uma linha divisória `border-t border-border` + espaçamento generoso
- Manter textos e CTAs

### Critério de Conclusão da Etapa 6
- [ ] Hero sem nenhum gradiente de cor
- [ ] Card de ranking ao vivo mostrando dados reais
- [ ] Layout split funcionando em desktop e mobile
- [ ] Seção CTA sem gradiente de fundo
- [ ] Nenhum gradient text

**Aguardar autorização para Etapa 7.**

---

## ETAPA 7 — Submissão de Atividade e Moderação

> **Impacto:** Médio — o fluxo de submissão é o mais usado.
> **Risco:** Baixo.
> **Arquivos tocados:** `submissions/new/page-content.tsx`, `moderation/page-content.tsx`, `submissions/page-content.tsx`

### 7.1 — Formulário de Nova Submissão

- Substituir o `<select>` simples por `Combobox` do shadcn/ui com busca
- Cada opção do Combobox: nome da atividade + `+XX XP` em mono amber alinhado à direita
- Campo de URL do comprovante: aparece com animação (`AnimatePresence`) apenas quando `requiresProof: true`
- **Estado de Sucesso** (novo):
  - Após envio bem-sucedido, não redirecionar imediatamente
  - Mostrar estado inline com Framer Motion:
    - Ícone `CheckCircle2` em `--success`, tamanho 48px, com `scale` animation (0.5 → 1)
    - "Contribuição enviada! Aguardando revisão."
    - Dois botões: "Submeter outra" (reset do form) | "Ver minhas submissões" (link)

### 7.2 — Histórico de Submissões

- Aplicar os mesmos ícones semânticos de status do Dashboard (Etapa 2.4)
- Submissão REJECTED: expandir ao clicar para mostrar o `feedback` do Auditor em um bloco de citação destacado

### 7.3 — Fila de Moderação

- **Agrupamento visual:** quando um membro tem 2+ submissões pendentes, exibir um badge `X submissões` ao lado do nome
- Adicionar filtro "Ver todas de um membro" (clicando no badge)
- Botões de ação dentro de cada item:
  - `[Aprovar]`: verde, filled, `height: 36px`
  - `[Rejeitar]`: outline destructive, `height: 36px`
  - Ao clicar Rejeitar: modal de feedback com textarea e contador de caracteres
- Link do comprovante: abrir em nova aba, não inline (sem iframe — risco de CORS)

### Critério de Conclusão da Etapa 7
- [ ] Combobox com busca na submissão
- [ ] Estado de sucesso celebrativo ao enviar
- [ ] Ícones semânticos de status no histórico
- [ ] Feedback expandível em submissões rejeitadas
- [ ] Agrupamento visual na fila de moderação

**Aguardar autorização para Etapa 8.**

---

## ETAPA 8 — Extrato e Transações

> **Impacto:** Médio.
> **Risco:** Baixo.
> **Arquivos tocados:** `transactions/page-content.tsx`

### 8.1 — Layout de Extrato

- Substituir a listagem simples por feed agrupado por data:
  - Sticky header por dia: `DD de mês de YYYY` em `label-sm` uppercase muted, posição sticky
  - Cada item: ícone do tipo de transação (semântico) + descrição legível + valor em mono + hora

### 8.2 — Ícones e Descrições de Tipo

| Tipo | Ícone | Cor | Descrição legível |
|---|---|---|---|
| `SUBMISSION_APPROVED` | `Zap` | success | "Submissão aprovada: [nome da atividade]" |
| `GRATITUDE_RECEIVED` | `Coins` | amber | "Gratidão recebida de @username" |
| `GRATITUDE_SENT` | `Coins` | muted | "Gratidão enviada para @username" |
| `AUDITOR_REWARD` | `ShieldCheck` | primary | "Recompensa de auditoria" |
| `PENALTY` | `TrendingDown` | danger | "Ajuste administrativo" |
| `MONTHLY_RESET` | `RefreshCw` | muted | "Renovação mensal — tokens restaurados" |

### 8.3 — Valor das Transações

- Valores positivos: `+XX XP` em `stat-sm` JetBrains Mono `--success`
- Valores negativos: `-X tokens` em `stat-sm` JetBrains Mono muted
- Penalidades: `-XX XP` em `stat-sm` danger

### 8.4 — Empty State

- Ícone `Receipt` + "Seu extrato está vazio. Faça sua primeira contribuição!"
- Link: "Ver atividades disponíveis"

### Critério de Conclusão da Etapa 8
- [ ] Extrato agrupado por data com sticky headers
- [ ] Ícones semânticos por tipo de transação
- [ ] Valores em JetBrains Mono com cores corretas

**Aguardar autorização para Etapa 9.**

---

## ETAPA 9 — og:image Dinâmica e Meta Tags

> **Impacto:** Alto para compartilhamento — crítico para o objetivo de "currículo comunitário".
> **Risco:** Médio — novo endpoint em Next.js.
> **Arquivos tocados:** novo `src/app/api/og/route.tsx`, `u/[username]/page.tsx`

### 9.1 — Rota `/api/og`

Criar `ImageResponse` do Next.js gerando uma imagem 1200×630px:
- Fundo: `#111411` (dark)
- Logo "DT" à esquerda (SVG embutido)
- @username em Space Grotesk bold, branco, grande
- Nível com cor semântica
- XP total em JetBrains Mono, âmbar
- `legado.devstocantins.com.br` em small, muted
- Linha decorativa em âmbar no topo

### 9.2 — Injetar meta tags no perfil público

Em `u/[username]/page.tsx` (server component), buscar dados do perfil e gerar as meta tags com `generateMetadata`.

### Critério de Conclusão da Etapa 9
- [ ] Acessar `/api/og?username=teste` retorna uma imagem real
- [ ] Colar link de perfil no WhatsApp mostra preview com a og:image
- [ ] Meta tags corretas no `<head>` das páginas de perfil público

**Aguardar autorização para Etapa 10.**

---

## ETAPA 10 — Padronização de Empty States e Skeletons

> **Impacto:** Baixo individualmente, alto no conjunto.
> **Risco:** Baixo.
> **Arquivos tocados:** criar `src/components/ui/empty-state.tsx`, `src/components/ui/skeleton-patterns.tsx`

### 10.1 — Componente EmptyState

```tsx
<EmptyState
  icon={Trophy}
  title="O ranking está vazio"
  description="Seja o primeiro a contribuir"
  action={{ label: "Ver atividades", href: "/activities" }}
/>
```

Aplicar em todas as páginas com estado vazio.

### 10.2 — Padrões de Skeleton

Criar skeleton específico para cada seção:
- `SkeletonStatCards` — 4 retângulos em grid
- `SkeletonLeaderboard` — pódio + 7 linhas de tabela
- `SkeletonProfile` — capa + header + 4 cards + feed
- `SkeletonFeed` — 5 linhas com ícone + texto + valor

### Critério de Conclusão da Etapa 10
- [ ] Todas as páginas têm skeleton ao carregar
- [ ] Todas as páginas têm empty state quando sem dados
- [ ] EmptyState é o mesmo componente em todas as páginas

---

## Ordem de Prioridade e Resumo

| Etapa | O que entrega | Tempo estimado | Dependências |
|---|---|---|---|
| **0** | Nova paleta + tipografia | 2–3h | Nenhuma |
| **1** | AppBar + Bottom Nav | 3–4h | Etapa 0 |
| **2** | Dashboard redesenhado | 3–4h | Etapas 0, 1 |
| **3** | Leaderboard sem gradiente, pódio real | 2–3h | Etapas 0, 1 |
| **4** | Perfil público completo | 4–5h | Etapas 0, 1 |
| **5** | Login/Cadastro split screen | 2–3h | Etapas 0, 1 |
| **6** | Landing page reescrita | 4–5h | Etapas 0, 1 |
| **7** | Submissão + Moderação | 3–4h | Etapas 0, 1 |
| **8** | Extrato com timeline | 2h | Etapas 0, 1 |
| **9** | og:image dinâmica | 2–3h | Etapa 4 concluída |
| **10** | Empty states + skeletons padronizados | 2h | Todas anteriores |

**Sequência recomendada:** 0 → 1 → 3 → 2 → 4 → 6 → 5 → 7 → 8 → 9 → 10

(Leaderboard antes do Dashboard porque valida os componentes de XP mono antes de aplicar no dashboard)
