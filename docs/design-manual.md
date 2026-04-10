# Manual de Design — Legado Tech / Devs Tocantins

> **Documento de referência para design, produto e frontend.**
> Este documento não descreve o que foi feito — descreve o que deve ser construído para entregar a melhor experiência possível ao usuário, independente do nível de retrabalho necessário.

---

## 1. Filosofia de Design

### O Produto em Uma Frase
> "Uma plataforma que transforma contribuições invisíveis em reputação permanente."

Toda decisão de design deve servir a isso. Se um elemento não torna a contribuição mais visível, a reputação mais tangível ou a experiência mais fluida — ele não deveria existir.

### Os Três Pilares da Experiência
1. **Legibilidade acima de tudo.** O usuário precisa entender em 3 segundos o que aconteceu, quanto vale e o que fazer a seguir. Informação confusa = sistema ignorado.
2. **Comunidade, não corporação.** A identidade visual deve sentir que foi feita por devs para devs — com personalidade, opiniões e calor humano. Não um produto de prateleira.
3. **Mérito fica visível.** Quem contribui mais deve se destacar visualmente, de forma óbvia e imediatamente compreensível. O ranking não é uma tabela — é um palco.

### O Que Nunca Fazer (Anti-padrões de IA e de template)
Esta seção é tão importante quanto qualquer regra positiva.

- **Proibido:** Degradê em hero sections. Nenhuma seção começa com `bg-gradient-to-br from-blue-600 to-purple-700`.
- **Proibido:** Cards flutuando com sombra pesada em todas as direções (`shadow-xl` indiscriminado). Sombra tem propósito; use elevation quando houver hierarquia.
- **Proibido:** O padrão "ícone grande + título + 3 linhas de texto" em grade 3 colunas para features. É o componente mais genérico da web.
- **Proibido:** Cor de fundo em todo botão. Botões secundários têm borda, não preenchimento colorido.
- **Proibido:** Texto em degradê (`bg-clip-text text-transparent`). Raro e proposital, não decorativo.
- **Proibido:** `border-radius` excessivo em tudo. Cards importantes têm cantos mais quadrados. Cantos muito arredondados comunicam "app de criança".
- **Proibido:** Espaçamento inconsistente. Todo espaçamento segue a escala de 4px definida neste documento.
- **Proibido:** Usar MUI e shadcn/ui misturados em novos componentes. A migração para shadcn/ui é o caminho único.

---

## 2. Identidade Visual

### 2.1 Conceito

A Devs Tocantins existe no cerrado: calor, cor, vegetação intensa, o rio Tocantins, o sol que não esconde. O Tocantins tem **azul** (o céu, o rio, a bandeira) e **dourado/âmbar** (o sol, o cerrado seco, o jacarandá). Mas não queremos parecer um órgão de governo.

A solução é usar essas cores com **intenção técnica**, não decorativa. O azul é autoridade e confiança (ações primárias, links). O âmbar é conquista, calor e recompensa (XP, rankings, badges, tokens). O fundo é neutro mas **não asséptico** — quente, humano.

O resultado visual é mais próximo de **Linear** ou **Vercel** do que de qualquer produto de governo. Clean, opinioso, com personalidade.

### 2.2 Paleta de Cores

#### Modo Claro (Light)

| Token | Valor Hex | Valor OKLCH | Uso |
|---|---|---|---|
| `--background` | `#F9F8F6` | `oklch(0.975 0.005 80)` | Fundo da página |
| `--surface` | `#FFFFFF` | `oklch(1 0 0)` | Cards, modais, popovers |
| `--surface-raised` | `#F3F2EF` | `oklch(0.955 0.005 80)` | Fundo de seções secundárias, tabelas |
| `--foreground` | `#111211` | `oklch(0.13 0.005 150)` | Texto principal — quase preto, ligeiramente quente |
| `--foreground-muted` | `#6B7280` | `oklch(0.52 0.01 255)` | Labels, textos auxiliares |
| `--foreground-subtle` | `#9CA3AF` | `oklch(0.68 0.01 255)` | Placeholders, hints |
| `--primary` | `#1D4ED8` | `oklch(0.48 0.22 265)` | Azul Tocantins — ações primárias, links ativos |
| `--primary-hover` | `#1E40AF` | `oklch(0.42 0.22 265)` | Hover do primary |
| `--accent` | `#D97706` | `oklch(0.64 0.18 70)` | Âmbar — XP, tokens, conquistas, 1º lugar |
| `--accent-light` | `#FEF3C7` | `oklch(0.96 0.07 95)` | Background de badges douradas |
| `--success` | `#059669` | `oklch(0.55 0.15 165)` | Status aprovado, crédito de XP |
| `--success-light` | `#D1FAE5` | `oklch(0.94 0.07 165)` | Background de status aprovado |
| `--danger` | `#DC2626` | `oklch(0.53 0.22 30)` | Status rejeitado, erro, débito |
| `--danger-light` | `#FEE2E2` | `oklch(0.94 0.06 30)` | Background de status rejeitado |
| `--warning` | `#D97706` | igual ao `accent` | Avisos, tokens prestes a expirar |
| `--border` | `#E5E3DF` | `oklch(0.91 0.008 80)` | Bordas de cards, inputs (levemente quente) |
| `--border-strong` | `#C9C7C3` | `oklch(0.82 0.008 80)` | Divisores fortes, separadores |

#### Modo Escuro (Dark)

| Token | Valor Hex | Valor OKLCH | Uso |
|---|---|---|---|
| `--background` | `#111411` | `oklch(0.14 0.008 145)` | Fundo da página — quase preto, toque de floresta |
| `--surface` | `#1C1F1C` | `oklch(0.19 0.008 145)` | Cards, modais |
| `--surface-raised` | `#252825` | `oklch(0.23 0.006 145)` | Seções secundárias |
| `--foreground` | `#F0EDE8` | `oklch(0.94 0.01 70)` | Texto principal — branco quente |
| `--foreground-muted` | `#9CA3A0` | `oklch(0.67 0.01 165)` | Labels auxiliares |
| `--foreground-subtle` | `#6B7270` | `oklch(0.52 0.01 165)` | Placeholders |
| `--primary` | `#3B82F6` | `oklch(0.62 0.22 265)` | Azul no dark (mais luminoso para acessibilidade) |
| `--accent` | `#F59E0B` | `oklch(0.74 0.18 70)` | Âmbar dourado — brilha no dark |
| `--accent-light` | `#78350F` | `oklch(0.35 0.12 55)` | Background escuro para badge dourada |
| `--success` | `#10B981` | `oklch(0.7 0.15 165)` | Verde no dark |
| `--success-light` | `#064E3B` | `oklch(0.28 0.1 165)` | |
| `--danger` | `#F87171` | `oklch(0.72 0.18 30)` | Vermelho no dark |
| `--danger-light` | `#450A0A` | `oklch(0.2 0.1 30)` | |
| `--border` | `#2A2E2A` | `oklch(0.26 0.008 145)` | Bordas |
| `--border-strong` | `#3D4239` | `oklch(0.33 0.01 145)` | |

> **Regra de ouro:** O fundo do dark mode não é `#000000`. É `#111411` — um preto com um toque ínfimo de verde floresta. Isso elimina a frieza do preto absoluto sem que ninguém perceba conscientemente. O mesmo para o light: `#F9F8F6`, não `#FFFFFF` como fundo de página.

#### Cores Semânticas de XP e Ranking

| Contexto | Cor | Token |
|---|---|---|
| 1º lugar, ouro, troféu | Âmbar `#F59E0B` | `--accent` |
| 2º lugar, prata | Cinza prateado `#9CA3AF` | `--foreground-muted` |
| 3º lugar, bronze | Âmbar escuro `#B45309` | `oklch(0.52 0.13 55)` |
| XP ganho, aprovação | Verde `--success` | |
| XP perdido, rejeição | Vermelho `--danger` | |
| Pendente, aguardando | Amarelo `--warning` | |
| Nível: Novato | Cinza | `--foreground-muted` |
| Nível: Contribuidor | Esmeralda | `oklch(0.6 0.15 165)` |
| Nível: Colaborador Ativo | Azul céu | `oklch(0.65 0.18 220)` |
| Nível: Referência | Azul profundo | `--primary` |
| Nível: Mentor | Âmbar | `--accent` |
| Nível: Lenda | Vermelho/Rosa intenso | `oklch(0.65 0.22 10)` |

### 2.3 Tipografia

#### Fontes Escolhidas

```
Heading: Space Grotesk (Google Fonts)
Body / UI: Inter (Google Fonts)
Números e Códigos: JetBrains Mono (Google Fonts)
```

**Por quê Space Grotesk para headings?**
É geométrica, moderna, tem personalidade sem ser extravagante. Funciona muito bem em tamanhos grandes (títulos de ranking, nomes de usuário no perfil público). É usada por produtos como Raycast e algumas features do Vercel. Não é uma escolha óbvia de template.

**Por quê JetBrains Mono para números?**
Todos os valores de XP, rankings, contadores de tokens devem ser exibidos em fonte mono. Isso cria um efeito visual de "dado real, não decoração" — como um terminal. Desenvolvedores reconhecem e confiam nesse pattern. O XP `1.337k` em mono parece um dado real, não uma métrica de marketing.

#### Escala Tipográfica

| Nome | Fonte | Tamanho | Peso | Uso |
|---|---|---|---|---|
| `display-xl` | Space Grotesk | 48px / 3rem | 700 | Títulos de landing page, herói |
| `display-lg` | Space Grotesk | 36px / 2.25rem | 700 | Títulos de seções principais |
| `heading-xl` | Space Grotesk | 28px / 1.75rem | 600 | Título de página |
| `heading-lg` | Space Grotesk | 22px / 1.375rem | 600 | Título de card importante, nome no perfil |
| `heading-md` | Space Grotesk | 18px / 1.125rem | 600 | Subtítulos de seção |
| `body-lg` | Inter | 16px / 1rem | 400 | Texto de corpo principal |
| `body-md` | Inter | 14px / 0.875rem | 400 | Labels, descrições, corpo secundário |
| `body-sm` | Inter | 12px / 0.75rem | 400 | Metadados, datas, hints |
| `label-md` | Inter | 14px / 0.875rem | 500 | Labels de formulário, nav links |
| `label-sm` | Inter | 12px / 0.75rem | 500 | Labels de tabela, badges de texto |
| `stat-xl` | JetBrains Mono | 32px / 2rem | 700 | Número principal de XP no dashboard |
| `stat-lg` | JetBrains Mono | 24px / 1.5rem | 700 | Números em cards de stat |
| `stat-md` | JetBrains Mono | 18px / 1.125rem | 600 | Posição no ranking, tokens |
| `stat-sm` | JetBrains Mono | 14px / 0.875rem | 500 | XP em linhas de tabela |
| `code` | JetBrains Mono | 13px / 0.8125rem | 400 | Códigos, @usernames em contexto técnico |

#### Regras de Uso de Fonte

- **@usernames** são sempre exibidos em `JetBrains Mono` com o prefixo `@`. Exemplo: `@leonardovinicius`.
- **Valores de XP** são sempre em `JetBrains Mono`, com formatação: `1.337k` para mil, `250` sem formatação abaixo de mil.
- **Datas** são em `body-sm` Inter, formato brasileiro: `15 abr` ou `15 de abril de 2026`.
- **Títulos de página** são em `heading-xl` Space Grotesk, sem negrito extra.
- **Nunca** use mais de 2 pesos da mesma fonte em uma mesma seção.

### 2.4 Espaçamento

Sistema baseado em múltiplos de 4px (escala 4-point grid):

| Token | Valor | Uso típico |
|---|---|---|
| `space-1` | 4px | Espaço entre ícone e texto |
| `space-2` | 8px | Padding interno de badges, gap entre itens pequenos |
| `space-3` | 12px | Gap interno de botões |
| `space-4` | 16px | Padding de cards compactos, gap entre cards |
| `space-5` | 20px | Padding de cards normais |
| `space-6` | 24px | Espaço entre seções internas de um card |
| `space-8` | 32px | Espaço entre seções de uma página |
| `space-12` | 48px | Espaço entre blocos maiores, top de seção |
| `space-16` | 64px | Espaço entre seções da landing page |
| `space-24` | 96px | Grandes separações em páginas de marketing |

**Regra:** Nunca use valores arbitrários de padding/margin. Se `12px` não está na escala de 4pt, use `12px` (é múltiplo de 4). Se `17px`, está errado.

### 2.5 Border Radius

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 4px | Badges de texto, tags |
| `radius-md` | 8px | Botões, inputs, cards compactos |
| `radius-lg` | 12px | Cards principais, modais |
| `radius-xl` | 16px | Cards de destaque, perfil |
| `radius-full` | 9999px | Avatares, indicadores circulares |

**Regra:** Cards de conteúdo (dashboard, leaderboard, perfil) usam `radius-lg` (12px). Não use `radius-xl` ou `radius-2xl` em elementos de conteúdo — reservado para elementos de destaque visual.

### 2.6 Sombras e Elevation

| Nível | Sombra CSS | Uso |
|---|---|---|
| 0 | nenhuma | Elementos embutidos na página |
| 1 | `0 1px 3px rgba(0,0,0,0.08)` | Cards em modo light |
| 2 | `0 4px 12px rgba(0,0,0,0.1)` | Modais, dropdowns abertos |
| 3 | `0 8px 24px rgba(0,0,0,0.14)` | Modais de destaque, toasts |

**Regra:** No dark mode, sombra é substituída por **bordas com opacidade**. Sombra preta sobre fundo preto não funciona. Use `border: 1px solid rgba(255,255,255,0.08)` em vez de box-shadow no dark.

---

## 3. Sistema de Componentes

### Biblioteca Base: shadcn/ui

**Decisão definitiva:** shadcn/ui é a única biblioteca de componentes para novos componentes. MUI pode ser mantido apenas em telas que ainda não foram migradas, mas nenhum novo componente deve usar MUI.

shadcn/ui com Tailwind v4 é a stack correta porque:
- Zero runtime CSS-in-JS
- Componentes que são literalmente código seu (copiados para o projeto)
- Primitivos do Radix UI que são acessíveis por padrão
- Funciona perfeitamente com Framer Motion para animações

### Ícones: Lucide React

Manter Lucide React como única biblioteca de ícones. Não misturar com `react-icons`, `heroicons` ou ícones do MUI. Consistência visual no stroke e tamanho é crítica.

**Tamanhos padrão:**
- `h-3 w-3` (12px) — inline em badges e textos
- `h-4 w-4` (16px) — dentro de botões, ao lado de texto
- `h-5 w-5` (20px) — nav links desktop, ações de card
- `h-6 w-6` (24px) — ícones de destaque em cards vazios
- `h-8 w-8` (32px) — ícones de empty state
- `h-10 w-10` (40px) — ícones de hero em empty states de página

**Ícones semânticos fixos (não mudar):**

| Significado | Ícone Lucide |
|---|---|
| XP, energia, contribuição | `Zap` |
| Ranking, troféu, 1º lugar | `Trophy` |
| Tokens de Gratidão | `Coins` |
| Aprovado | `CheckCircle2` |
| Rejeitado / Erro | `XCircle` |
| Pendente | `Clock` |
| Submissão / Atividade | `ClipboardList` |
| Catálogo de Atividades | `BookOpen` |
| Moderação | `ShieldCheck` |
| Perfil | `User` |
| Dashboard | `LayoutDashboard` |
| Histórico / Extrato | `Receipt` |
| Badge / Conquista | `Award` |
| QR Code / Evento | `QrCode` |
| Compartilhar perfil | `Share2` |
| Nível / Level-up | `TrendingUp` |

### Animações: Framer Motion

Framer Motion já está instalado. Use-o com disciplina.

**Regras de animação:**
- `duration: 0.15s` para micro-interações (hover, focus)
- `duration: 0.2s` para transições de estado (loading → loaded)
- `duration: 0.3s` para entradas de conteúdo (cards appearing)
- `duration: 0.4s–0.5s` para modais e sheets
- Nunca exceda `0.5s` em qualquer animação de UI
- `ease: [0.16, 1, 0.3, 1]` (ease-out expo) para entradas
- `ease: "easeOut"` para a maioria das transições

**O que deve ser animado:**
- Entrada de cards no leaderboard (stagger)
- A barra de progresso de nível (ao carregar, preenche da esquerda para direita)
- Contador de XP (quando aprovação acontece, o número "conta" para cima)
- Modal/Dialog (slide-up + fade)
- Toast/Sonner notifications (já vem com animação)
- Skeleton para loading states

**O que NÃO deve ser animado:**
- Hover de links de navegação (apenas color transition via CSS)
- Tabelas (transição de linha é suficiente com `transition-colors`)
- Conteúdo abaixo do fold (não use scroll-triggered animations — adiciona complexidade sem valor real)

### Toasts: Sonner

Sonner já está instalado. Configurar com posição `bottom-right` em desktop e `top-center` em mobile.

Uso obrigatório para:
- Aprovação de submissão pelo usuário
- Token enviado com sucesso
- Erro de formulário genérico
- Confirmação de ações irreversíveis

---

## 4. Layout e Estrutura de Páginas

### 4.1 Grid e Larguras Máximas

| Contexto | Largura Máxima | Padding lateral |
|---|---|---|
| Landing page (hero) | 100vw | 24px mobile / 40px tablet / 80px desktop |
| Conteúdo de landing | `max-w-5xl` (1024px) | centralizado |
| Páginas de app (dashboard, leaderboard) | `max-w-6xl` (1152px) | 16px mobile / 24px tablet / 32px desktop |
| Perfil público | `max-w-3xl` (768px) | 16px mobile / 24px tablet |
| Formulários (login, submissão) | `max-w-md` (448px) | centralizado |
| Admin | `max-w-7xl` (1280px) | |

### 4.2 Navegação Principal (AppBar)

**Comportamento:**
- Sticky no topo, `height: 56px`
- Fundo: `bg-background/80` com `backdrop-blur-md` — translúcido, não sólido
- Borda inferior: `border-b border-border/50` — sutil, não pesada
- Nunca tem sombra — a borda é suficiente

**Logo:**
- À esquerda, gap de `24px` para o nav
- Composto por: símbolo + wordmark
- Símbolo: um ícone customizado ou logo SVG da Devs Tocantins (ver seção de imagens)
- Em telas pequenas: apenas o símbolo (sem wordmark)
- **Nunca** usar apenas texto como logo

**Nav links (desktop):**
- Fonte: `label-md` Inter
- Estado inativo: `text-foreground-muted`, sem fundo
- Estado ativo: `text-primary`, fundo `bg-primary/8` (muito sutil)
- Hover: `text-foreground`, fundo `bg-surface-raised`
- Sem underline em links de nav

**Nav mobile:**
- Drawer (slide-in da esquerda) ou bottom sheet, não o dropdown hambúrguer atual
- O menu mobile deve mostrar o avatar e nome do usuário no topo do drawer antes dos links

**Seletor de tema:**
- Ícone `Moon`/`Sun` de 16px, posição: extrema direita antes do avatar
- Animação: rotate 180deg ao trocar (Framer Motion)

### 4.3 Estrutura de Página Interna

Toda página autenticada segue:

```
┌─────────────────────────────────────────────┐
│  AppBar (sticky, 56px)                      │
├─────────────────────────────────────────────┤
│                                             │
│  Page Header (opcional)                     │
│  ├── Título da página (heading-xl)          │
│  └── Descrição curta (body-md, muted)       │
│                                             │
│  Conteúdo principal                         │
│  (max-width do contexto, centralizado)      │
│                                             │
│  padding-bottom: 48px                       │
└─────────────────────────────────────────────┘
```

**O Page Header não é obrigatório em todas as páginas.** O Dashboard não precisa de um `<h1>Dashboard</h1>` — o conteúdo já fala por si. Use o Page Header apenas quando for necessário para orientação do usuário.

---

## 5. Páginas — Especificações Detalhadas

### 5.1 Landing Page (Home — Visitante)

**Objetivo:** Em 5 segundos, o visitante deve entender "o que é isso e por que eu devo querer fazer parte".

**Estrutura:**

```
┌─────────────────────────────────────────────────────┐
│  SEÇÃO HERO (100vh ou próximo)                      │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐    │
│  │                  │  │                      │    │
│  │  Statement       │  │  Preview do Ranking  │    │
│  │  principal       │  │  (live, top 5)       │    │
│  │                  │  │                      │    │
│  │  CTAs            │  │  Card vivo com dados │    │
│  │                  │  │  reais da comunidade │    │
│  └──────────────────┘  └──────────────────────┘    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  SEÇÃO "COMO FUNCIONA" (3 passos simples)           │
│  Layout: timeline horizontal com ícones grandes     │
├─────────────────────────────────────────────────────┤
│  SEÇÃO "ATIVIDADES RECONHECIDAS"                    │
│  Layout: lista/grid de atividades reais da API      │
├─────────────────────────────────────────────────────┤
│  SEÇÃO "PERFIS EM DESTAQUE"                         │
│  Layout: cards horizontais dos top 3 do mês         │
├─────────────────────────────────────────────────────┤
│  SEÇÃO CTA FINAL                                    │
│  Layout: tipográfico, sem decoração pesada          │
└─────────────────────────────────────────────────────┘
```

**Seção Hero — Especificação Detalhada:**
- Fundo: `--background` sem qualquer imagem ou degradê de cor
- Layout split: `grid grid-cols-1 lg:grid-cols-2` gap de 64px
- Coluna esquerda:
  - Eyebrow (texto pequeno acima do título): `DEVS TOCANTINS` em `label-sm` tracking-widest, cor `--accent`
  - Título principal: 2–3 linhas em `display-lg` Space Grotesk, cor `--foreground`
  - Exemplo de copy: *"Sua contribuição para a comunidade merece existir além do grupo do WhatsApp."*
  - Subtítulo: 1–2 linhas `body-lg`, cor `--foreground-muted`
  - CTAs: 2 botões — primário ("Começar agora", `variant="default"`) e secundário ("Ver o ranking", `variant="outline"`)
- Coluna direita:
  - Card com borda, `radius-xl`, mostrando os top 5 membros do mês em tempo real
  - Título interno: "Top 5 — Abril 2026" com ícone `Trophy`
  - Para cada posição: avatar + @username + nível + XP (em JetBrains Mono)
  - O card "vive" — os dados são reais e atualizados

**Imagens na Landing Page:**
- **Nenhum banco de imagens genericamente bonito** (sem Unsplash de cidade ou código)
- **Opção A (ideal):** Fotos reais de eventos da comunidade Devs Tocantins — meetups, palestras, hackathons. Essas fotos devem ser usadas como background em uma das seções internas com overlay escuro.
- **Opção B (fallback):** Foto aérea do cerrado tocantinense ou vista de Palmas, usada com overlay de cor `--primary` com opacidade 80%, resultando em um tom azul-noite que combina com a identidade.
- **Onde colocar a imagem:** Seção "Perfis em Destaque" pode ter um fundo com foto de evento (overlay escuro), criando contraste entre a vida real da comunidade e os dados digitais.
- **Especificação da foto:** Mínimo 1920×1080px, formato WebP. A foto deve ser real, humanizada — pessoas de verdade, não cenários vazios.

---

### 5.2 Login e Cadastro

**Layout:** Split screen — 50/50 em desktop, formulário ocupa 100% em mobile.

```
┌────────────────────┬────────────────────┐
│                    │                    │
│  Coluna da Imagem  │  Coluna do         │
│  (oculta mobile)   │  Formulário        │
│                    │                    │
│  Foto ou arte      │  Logo              │
│  com overlay e     │  Título da ação    │
│  quote da          │  Formulário        │
│  comunidade        │  CTA               │
│                    │  Link auxiliar     │
└────────────────────┴────────────────────┘
```

**Coluna da Imagem:**
- Fundo escuro (usa o modo dark mesmo se o app estiver em light)
- Imagem: foto de evento da comunidade com overlay `oklch(0.12 0.01 145 / 75%)`
- Sobre a imagem: quote de um membro real da comunidade, assinado com @username
- Exemplo: *"Ajudei um júnior a configurar o ambiente em 40 minutos. Nunca imaginei que isso viraria pontos."* — @mariasouza
- Logo da Devs Tocantins no topo da coluna, versão branca

**Coluna do Formulário:**
- Fundo: `--background`
- Logo pequeno (versão para fundo claro) no topo esquerdo
- Formulário centralizado vertical e horizontalmente
- `max-w-sm` para o formulário em si
- Inputs: `radius-md`, borda `--border`, label acima (não placeholder como label)

---

### 5.3 Dashboard (Membro Autenticado)

**Objetivo:** Em 3 segundos, o membro sabe onde está, o que ganhou e o que fazer.

**Layout — Desktop:**

```
┌────────────────────────────────────────────────┐
│  Saudação + @username + nível atual            │
│  "Olá, Leonardo! Você é um Colaborador Ativo"  │
├────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐  │
│  │ XP   │ │ XP   │ │ XP   │ │ Tokens de    │  │
│  │Total │ │ Mês  │ │ Ano  │ │ Gratidão     │  │
│  └──────┘ └──────┘ └──────┘ └──────────────┘  │
├──────────────────────┬─────────────────────────┤
│  Nível e Progresso   │  Submissões Recentes     │
│  (1/3 da largura)    │  (2/3 da largura)        │
├──────────────────────┴─────────────────────────┤
│  Ações Rápidas (botões em linha)               │
└────────────────────────────────────────────────┘
```

**Cards de Stat — Especificação:**
- Fundo: `--surface`, borda `--border`
- Sem ícone colorido com fundo colorido (anti-padrão de template)
- Em vez disso: label em `body-sm` muted no topo, valor em `stat-lg` JetBrains Mono, e uma linha de contexto `body-sm` abaixo
- Card de XP Total: o maior e mais proeminente. Se possível, ocupa mais espaço ou tem o número em tamanho maior
- Card de Tokens: exibe data de expiração em `body-sm` warning se for o último dia do mês

**Barra de Progresso de Nível:**
- Não usar a barra padrão do shadcn/ui sem personalização
- A cor da barra deve ser a cor do nível atual (`--accent` para Mentor, verde para Contribuidor, etc.)
- Animação: ao carregar a página, a barra preenche da esquerda para a direita em `0.6s` com `ease-out expo`
- Exibe: nome do nível atual à esquerda, `XX% para próximo nível` à direita
- Abaixo da barra: `X XP para [próximo nível]` em `body-sm` muted

**Submissões Recentes:**
- Lista, não tabela
- Cada item: nome da atividade (bold) + data + status como badge + XP ganho (em verde, JetBrains Mono)
- Status pendente: badge com `background: --surface-raised`, borda `--border`, texto muted + ícone `Clock`
- Não exibir mais que 5 itens — link "Ver todas" no header do card

**Ações Rápidas:**
- Botões em linha horizontal, wrap em mobile
- Máximo 4–5 botões visíveis de uma vez
- Ação primária ("Submeter Atividade") tem `variant="default"` (cor primária)
- As demais: `variant="outline"`
- Mobile: os botões ficam em grade 2×2 com ícone acima do texto

---

### 5.4 Leaderboard (Ranking)

**Objetivo:** O palco. A competição. Quem vê deve sentir que quer estar ali.

**Tabs de período:**
- "Este Mês" / "Este Ano" / "Todos os Tempos"
- Tabs simples com linha indicadora `--primary`, não fundo preenchido
- A tab ativa muda o conteúdo com fade transition (`opacity: 0` → `opacity: 1`, `0.15s`)

**Pódio (Top 3) — A Diferença Real:**

Não usar três cards iguais com gradientes. Usar o conceito visual de pódio literal:

```
        ┌──────────┐
        │  🏆 1º   │  ← Mais alto visualmente
        │ @usuario │
        │   230k   │
 ┌────┐ │   XP     │ ┌────┐
 │🥈2º│ └──────────┘ │🥉3º│
 │    │              │    │
 └────┘              └────┘
```

- Os três cards têm alturas diferentes via CSS (1º: mais alto)
- Fundo dos cards: sem degradê. Usar borda colorida: borda dourada para 1º, cinza para 2º, âmbar escuro para 3º
- Avatar circular de `48px` com borda na cor do pódio
- Nome em `heading-md` Space Grotesk
- XP em `stat-md` JetBrains Mono
- O card do 1º lugar tem uma animação sutil de "shimmer" na borda (Framer Motion, `border-color` pulsando de dourado para dourado mais claro)

**Tabela (4º em diante):**
- Tabela HTML semântica (`<table>`)
- Linha com hover: `background: --surface-raised` com `transition-colors 0.1s`
- Colunas: `#` (posição, em `stat-sm` mono) | Avatar + @username | Nível | XP
- Sem colunas desnecessárias (não exibir tokens na tabela pública)
- `@username` é link para `/u/:username`
- A linha do usuário logado tem `background: --primary/5` (highlight sutil) e um indicador `◀ Você` na coluna de posição

---

### 5.5 Perfil Público `/u/:username`

**Objetivo:** Esse é o currículo. Deve ser belo, compartilhável e autoexplicativo para um recrutador que nunca ouviu falar da plataforma.

**Layout:**

```
┌──────────────────────────────────────────────┐
│  HEADER DO PERFIL                            │
│  Avatar (64px) + Nome + @username + Nível   │
│  "Última contribuição: há 3 dias"           │
│  Botão: [Compartilhar Perfil] [Posição #7] │
├──────────────────────────────────────────────┤
│  STAT CARDS (2 colunas mobile, 4 desktop)   │
│  XP Total | XP Mês | XP Ano | Posição       │
├──────────────────────────────────────────────┤
│  BARRA DE PROGRESSO DE NÍVEL                │
├──────────────────────────────────────────────┤
│  BADGES E CONQUISTAS                        │
│  Grid horizontal com scroll, se houver      │
├──────────────────────────────────────────────┤
│  HISTÓRICO DE CONTRIBUIÇÕES                 │
│  Lista das últimas 10 aprovadas             │
└──────────────────────────────────────────────┘
```

**Header do Perfil — Especificação da Imagem:**
- Avatar: circular, `64px` desktop, `56px` mobile
- Se sem avatar: placeholder com as iniciais do usuário em `heading-md`, cor primária, fundo `--primary/10`
- **Imagem de capa (opcional, mas ideal):** Uma faixa fina de `160px` de altura acima do header, com foto de evento ou paisagem do Tocantins com overlay. Se não houver foto personalizada, usar um pattern geométrico sutil (não degradê) nas cores da identidade.
- Nível: badge com cor do nível, posicionada ao lado do nome — não abaixo

**Badges e Conquistas:**
- Cada badge: quadrado arredondado `48×48px` com ícone ou arte
- Hover: tooltip com nome do badge e data de conquista
- Layout: flex horizontal com scroll horizontal em mobile
- Badges de ranking histórico ("Top 1 — Abril 2026"): fundo âmbar, ícone trophy
- Se não tiver badges: seção omitida completamente (não mostrar "nenhuma conquista")

**Histórico de Contribuições:**
- Feed vertical, não tabela
- Cada item: ícone da atividade (ou tipo) + nome da atividade + `+XX XP` em verde mono + data
- As atividades mais recentes primeiro
- Se vazia: mensagem "Aguardando primeiras contribuições" com ícone `Zap`

**Botão "Compartilhar Perfil":**
- Sempre visível no topo direito do perfil
- Copia a URL `legado.tech/u/:username` para o clipboard
- Toast de confirmação: "Link copiado! Compartilhe seu legado 🔗"

**Meta tags para compartilhamento (og:image):**
- A página deve gerar uma og:image dinâmica (Next.js `ImageResponse`) mostrando:
  - Fundo escuro com cor de identidade
  - Logo Devs Tocantins
  - @username + nível + XP total
  - "Ver perfil em legado.devstocantins.com.br"
- Isso faz o link ficar bonito quando colado no LinkedIn, WhatsApp, Twitter

---

### 5.6 Submissão de Atividade

**Objetivo:** Ser tão simples que o usuário não desista no meio.

**Layout:** Formulário centralizado, `max-w-lg`, uma coluna.

**Fluxo:**
1. Escolha a atividade (select com busca — `Combobox` do shadcn/ui)
2. Cole o link do comprovante (aparece apenas se `requiresProof: true`)
3. Botão "Submeter"

**Estado de Sucesso:**
- Após envio: **não** redirecionar imediatamente. Mostrar um estado inline:
  - Ícone `CheckCircle2` em verde grande
  - "Sua contribuição foi enviada! Um Auditor irá revisá-la em breve."
  - "Adicionar outra contribuição" (reset do formulário) ou "Ver minhas submissões"
- Esse momento de celebração é importante para o engajamento

**Select de Atividade:**
- Combobox com busca (o usuário digita e filtra)
- Cada opção mostra: nome da atividade + XP ao lado direito em `stat-sm` mono + âmbar
- Grouping por categoria quando aplicável

---

### 5.7 Moderação (Auditores)

**Objetivo:** Processar rápido, com contexto suficiente para decidir com confiança.

**Layout:** Lista à esquerda (ou lista full-width com linhas expansíveis em mobile).

**Item da Fila:**
- Linha compacta com: avatar + @username + nome da atividade + tempo na fila + ícone de comprovante (se houver)
- Ao clicar/expandir: detalhe completo com link do comprovante em iframe ou preview
- Botões de ação: `[Aprovar]` (verde, primary) e `[Rejeitar]` (outline destructive)
- "Rejeitar" abre modal pedindo o `feedback` obrigatório

**Agrupamento visual:**
- Membros com múltiplas submissões pendentes têm suas linhas agrupadas visualmente com um indicador de "X submissões pendentes deste membro"
- Isso não é um bloqueio — é contexto para o Auditor

---

### 5.8 Extrato (Tokens e Transações)

**Objetivo:** Ser como um extrato bancário — completo, cronológico, legível.

**Layout:** Lista vertical cronológica decrescente.

**Item de Transação:**
- Ícone do tipo: `Zap` (submission), `Coins` (gratidão), `ShieldCheck` (recompensa auditor), `TrendingDown` (penalty)
- Descrição: texto legível em `body-md` — "Submissão aprovada: Artigo Publicado" ou "Gratidão recebida de @colega"
- Valor: `+XX XP` em verde mono (crédito) ou `-X tokens` em âmbar (débito de token)
- Data: `body-sm` muted
- Separador de data (sticky header por dia) para facilitar leitura

---

## 6. Imagens — Guia Completo

### 6.1 Tipos de Imagem Necessários

| Tipo | Uso | Tamanho Ideal | Formato |
|---|---|---|---|
| Logo horizontal | Header, e-mails, og:image | SVG / 480×120px PNG | SVG preferencial |
| Logo símbolo | Favicon, app icon, emblema pequeno | SVG / 64×64px | SVG |
| Logo versão branca | Fundos escuros, coluna de login | SVG | SVG |
| Foto de evento (principal) | Landing page, coluna de login | 1920×1080px | WebP |
| Foto de evento (secundária) | Cards de destaque | 800×600px | WebP |
| Foto de Tocantins (landscape) | Background de seções | 1920×1080px | WebP |
| og:image template | Compartilhamento de perfil | 1200×630px | PNG dinâmico |
| Avatar placeholder | Perfis sem foto | SVG / gerado | SVG |
| Arte de badge | Conquistas | 128×128px | SVG ou PNG |

### 6.2 Onde Cada Imagem Aparece

#### Logo
- AppBar: versão completa (símbolo + wordmark) em desktop, só símbolo em mobile
- Coluna de login: versão branca, tamanho reduzido
- Favicon: símbolo SVG
- og:image: símbolo + wordmark, versão branca sobre fundo escuro

**Especificação do Logo:** O símbolo deve ser único e proprietário — não usar o ícone `Zap` do Lucide como logo permanente. O símbolo ideal para a Devs Tocantins pode incorporar:
- Referência sutil ao estado (a forma do Tocantins, uma silhueta do cerrado, o peixe dourado)
- Combinado com elemento de tecnologia (terminal, seta de deploy, ponto de conexão)
- Deve funcionar em versão mono (preto sobre branco e branco sobre preto)

#### Foto de Evento (Principal)
- **Landing page, seção Hero:** na coluna da direita, como fundo do card de ranking — overlay escuro 50%
- **Página de Login:** coluna esquerda — overlay escuro 75%
- **Deve mostrar:** pessoas reais, ambiente de evento, laptops, apresentações, salas de aula

#### Foto de Tocantins / Cerrado
- **Landing page, seção CTA final:** fundo da seção com overlay `--primary` 60%
- **Perfil público, capa:** overlay sutil 30%, visualmente elegante
- **Deve mostrar:** paisagem reconhecível — o rio, o cerrado, Palmas ao entardecer. Nada de clichê turístico. Foto real, com qualidade.

#### Arte dos Badges
- Cada badge tem uma arte própria — não são ícones do Lucide
- Estilo: flat design, paleta limitada (2–3 cores), alto contraste
- Exemplos: troféu estilizado para ranking, chama para Lenda, estrela para contribuições
- Se não houver arte: usar a inicial da conquista dentro de um hexágono colorido (fallback programático)
- Armazenar em S3 e referenciar por URL

### 6.3 Padrão para Ausência de Imagens

Enquanto as imagens reais não existirem, usar soluções programáticas dignas:

- **Avatar sem foto:** Gerar com as iniciais do usuário, fundo na cor derivada do hash do `@username` (sempre a mesma cor para o mesmo usuário)
- **Foto de evento ausente:** Fundo com pattern geométrico sutil em CSS (grid de pontos ou linhas diagonais finas) nas cores da identidade. **Nunca** usar imagem de placeholder de internet.
- **Badge sem arte:** Hexágono SVG inline com a letra inicial da conquista, na cor semântica do tipo

---

## 7. Estados de Interface

### 7.1 Loading States

**Regra:** Nunca mostrar spinner em conteúdo de lista ou card. Use sempre skeleton.

Skeleton pattern:
```tsx
// Altura do skeleton deve corresponder à altura real do conteúdo
<div className="animate-pulse rounded-lg bg-surface-raised h-[XX]px" />
```

Para stats (os 4 cards do dashboard): 4 skeletons em grid, mesma proporção dos cards reais.
Para lista de submissões: 5 linhas skeleton, cada uma com a altura da linha real.
Para o leaderboard: skeleton do pódio (3 blocos em alturas diferentes) + 7 linhas de tabela.

### 7.2 Empty States

Cada empty state tem:
- Ícone grande (`h-10 w-10`) em `--foreground-subtle`
- Título em `heading-md` muted
- Descrição curta em `body-md` muted
- CTA opcional (link ou botão para resolver o estado vazio)

**Não usar** os mesmos ícones do lucide para todos os empty states. Cada seção tem seu ícone semântico.

| Página | Ícone | Título | CTA |
|---|---|---|---|
| Submissões (nenhuma) | `ClipboardList` | "Nenhuma contribuição ainda" | "Submeter minha primeira" |
| Leaderboard (sem dados) | `Trophy` | "O ranking está vazio" | — |
| Extrato (nenhuma tx) | `Receipt` | "Sem movimentações" | — |
| Perfil (sem aprovações) | `Zap` | "Aguardando primeiras contribuições" | — |
| Badges (nenhum) | omitir a seção inteira | — | — |

### 7.3 Estados de Erro

- Erro de rede: toast `sonner` com mensagem amigável + botão "Tentar novamente"
- 404 de perfil: página `404` customizada com mensagem humanizada ("O usuário @xxx ainda não existe aqui — mas talvez ele devesse.")
- Formulário inválido: mensagem de erro inline abaixo do campo, nunca em toast
- Conflict (409): mensagem inline específica, nunca "Algo deu errado"

---

## 8. Responsividade

### Breakpoints

| Nome | Valor | Contexto |
|---|---|---|
| `sm` | 640px | Smartphones landscape, tablets pequenos |
| `md` | 768px | Tablets |
| `lg` | 1024px | Notebooks, desktop pequeno |
| `xl` | 1280px | Desktop padrão |
| `2xl` | 1536px | Telas grandes |

### Prioridades Mobile

O sistema tem uma situação crítica de mobile: **o check-in de evento por QR Code é feito no celular, em pé, em um evento**. Isso significa que a tela de check-in (`/activities/secret/[code]`) deve ser perfeitamente funcional em mobile com uma mão.

**Regras específicas para mobile:**
- Botões de ação primária: `height: 48px` mínimo (área de toque)
- Nenhum elemento clicável menor que `44×44px` (guideline WCAG/Apple)
- Formulários: inputs com `font-size: 16px` mínimo (previne zoom automático no iOS)
- Bottom navigation para mobile (substituir o hamburger menu por tabs fixas na parte inferior)

**Bottom Navigation (Mobile):**

```
┌─────────────────────────────────┐
│                                 │
│  Conteúdo da página             │
│                                 │
├─────┬───────┬──────┬────────────┤
│ 🏠  │  📋   │ 🏆   │   👤       │
│Home │Submis │Rank  │  Perfil    │
└─────┴───────┴──────┴────────────┘
```

---

## 9. Acessibilidade

Requisitos mínimos inegociáveis:

- **Contraste:** Todo texto de corpo deve ter contraste mínimo 4.5:1 (WCAG AA). Textos de destaque: 3:1. Verificar com `oklch` — especialmente o âmbar sobre branco.
- **Focus visible:** Nunca remover o `outline` de foco. Customizar para `outline: 2px solid --primary, offset: 2px`.
- **Alt text:** Toda imagem com `<img>` tem `alt` descritivo. Imagens decorativas: `alt=""`.
- **Headings:** Hierarquia correta — uma `<h1>` por página, `<h2>` para seções, `<h3>` para sub-seções.
- **Tabelas:** `<thead>`, `<th scope="col">` em todas as tabelas de dados.
- **Formulários:** Todo `<input>` tem `<label>` associado via `htmlFor`. Sem `placeholder` como único label.
- **Componentes Radix (via shadcn):** Já vêm com ARIA correto — não sobrescrever role ou aria-* sem necessidade.

---

## 10. Performance

- **Fontes:** Carregar via `next/font` (sem layout shift). Space Grotesk, Inter e JetBrains Mono devem ser configuradas em `layout.tsx`.
- **Imagens:** Toda imagem usa `next/image` com `width`, `height` e `priority` nos above-the-fold.
- **Skeleton vs Spinner:** Sem spinners em conteúdo de lista. O skeleton já está especificado em 7.1.
- **React Query:** `staleTime: 5 * 60 * 1000` para catálogo de atividades e ranking (dados que não mudam por segundo). Refetch no foco da janela para dados do usuário.
- **Lazy loading de rotas admin:** As rotas de `/admin-panel/*` devem ser carregadas de forma lazy (não impactam o bundle do usuário comum).

---

## 11. Resumo das Decisões Técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Componentes UI | shadcn/ui + Radix | Acessível, sem runtime CSS-in-JS, código seu |
| Ícones | Lucide React | Consistente, tree-shakeable |
| Animações | Framer Motion | Já instalado, controle fino |
| Fontes heading | Space Grotesk | Personalidade sem extravagância |
| Fontes body | Inter | Indústria padrão, máxima legibilidade |
| Fontes números | JetBrains Mono | Autenticidade de dado, identidade dev |
| Toasts | Sonner | Já instalado, acessível, bonito |
| Charts (futuro) | Recharts | Integração nativa shadcn, leve |
| Cores background light | `#F9F8F6` | Quente, não asséptico |
| Cores background dark | `#111411` | Quase preto com toque orgânico |
| Cor primária | Azul Tocantins | Autoridade, confiança, identidade regional |
| Cor de acento | Âmbar dourado | Conquista, calor, recompensa |
| MUI | Migrar progressivamente | Não usar em novos componentes |

---

## 12. Checklist para Cada Nova Tela

Antes de considerar uma tela pronta, verificar:

- [ ] Modo light e dark testados com o toggle
- [ ] Testado em viewport 375px (iPhone SE) e 1440px (desktop)
- [ ] Loading state com skeleton implementado
- [ ] Empty state implementado e com copy real
- [ ] Estados de erro (404, network error) cobertos
- [ ] Sem `text-black` ou `text-white` hardcoded — usar apenas tokens semânticos
- [ ] Fontes corretas: heading em Space Grotesk, números em JetBrains Mono
- [ ] Nenhum gradiente decorativo
- [ ] Contraste de texto verificado (principalmente âmbar sobre branco)
- [ ] Botões com `height: 44px` mínimo em mobile
- [ ] Nenhum novo componente MUI adicionado
- [ ] og:meta tags presentes em páginas públicas (landing, perfil público)
