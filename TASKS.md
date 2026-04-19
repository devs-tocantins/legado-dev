# legado.dev — Lista de Tarefas

**Produto:** legado.dev  
**Slogan:** "A sua história não será esquecida"  
**Status:** Em desenvolvimento ativo

---

## ✅ Concluído

### Identidade Visual
- [x] Logo principal criada em SVG isométrico (`logo.svg` na raiz)
- [x] Logo mark sem fundo (`public/LOGO.svg`) — usada em componentes
- [x] Favicon SVG (`public/LOGO.svg`) — referenciado no metadata do layout
- [x] Nome "legado.dev" aplicado em todos os componentes (app-bar, auth-layout)
- [x] Slogan aplicado nas telas de login e cadastro

### Telas de Auth (Login / Cadastro)
- [x] Corrigido crash "Failed to fetch" nas telas de login/cadastro — `auth-provider.tsx` não tinha `catch` no `loadData`, causando `TypeError` quando a API estava indisponível
- [x] Navbar restaurada nas telas de login e cadastro — `app-bar.tsx` escondia indevidamente a barra nessas rotas (também corrigida violação de React Hooks no mesmo arquivo)
- [x] Removido scroll nas telas de login e cadastro — `auth-layout.tsx` usa `h-[calc(100vh-3.5rem)]` e `page-wrapper.tsx` trava `document.body.overflow` via `useEffect`

### Renomeação (Devs Tocantins → legado.dev)
- [x] `common.json` (pt-BR e en) — `app-name` e `title` atualizados
- [x] `home.json` (pt-BR e en) — título atualizado com slogan
- [x] `privacy-policy.json` (pt-BR) — referências à empresa atualizadas
- [x] `auth-layout.tsx` — nome e logo mark substituídos
- [x] `app-bar.tsx` — nome e logo mark substituídos
- [x] `sign-in/page-content.tsx` — subtitle atualizado
- [x] `sign-up/page-content.tsx` — subtitle atualizado
- [x] `page-content.tsx` (home/landing) — eyebrow atualizado
- [x] `dashboard/page-content.tsx` — texto de subtítulo atualizado
- [x] `leaderboard/page-content.tsx` — texto de subtítulo atualizado
- [x] Todos os `page.tsx` com metadata hardcoded (8 arquivos)
- [x] `u/[username]/page.tsx` — título e descrição OG atualizados
- [x] `api/og/route.tsx` — logo e slogan atualizados
- [x] `en/common.json` — chaves de navegação faltantes adicionadas (activities, submissions, transactions, gamificationProfiles)

---

## 🔐 Segurança — Corrigir antes de ir ao ar

### Backend (`api-legado-dev`)

- [x] **[IDOR] `PATCH /v1/submissions/:id`** — já restrito a `RoleEnum.admin` via `RolesGuard` (verificado em `submissions.controller.ts`)
- [x] **[IDOR] `PATCH /v1/gamification-profiles/:id`** — já restrito a `RoleEnum.admin` via `RolesGuard` (verificado em `gamification-profiles.controller.ts`)
- [x] **[AUTH] `GET /v1/files/:path`** — não se aplica: arquivos em produção estão no R2 com URL pública por design; uploader local só é usado em dev

### Frontend (`legado-dev`)

- [x] **[Open Redirect] `returnTo` sem validação** — corrigido em `with-page-required-guest.tsx`: valida que o valor começa com `/` e não com `//`
- [x] **[Insecure Storage] Cookie JWT sem flags de segurança** — corrigido em `auth-tokens-info.ts`: adicionado `secure: true` (prod) + `sameSite: 'strict'`
- [x] **[Bug] URL dupla `/pt-BR/pt-BR/submissions`** — corrigido em `submissions/new/page-content.tsx` e `secret/page-content.tsx`: removido prefixo de idioma manual nos `href` (o componente `Link` já adiciona automaticamente)

---

## 🔴 Crítico — Fazer antes de ir ao ar

### Favicon / Ícones de App
- [x] Gerar `favicon.ico` (32×32 px) a partir de `public/favicon.svg`
  ```bash
  # Com Inkscape:
  inkscape public/favicon.svg --export-type=png --export-filename=tmp-favicon.png --export-width=32 --export-height=32
  # Em seguida converter para .ico com imagemagick ou outro conversor
  ```
- [x] Gerar `public/apple-touch-icon.png` (180×180) para iOS
  ```bash
  inkscape public/favicon.svg --export-type=png --export-filename=public/apple-touch-icon.png --export-width=180 --export-height=180
  ```
- [x] Substituir `src/app/favicon.ico` pelo ícone gerado da nova marca
- [x] Considerar `public/icon-192.png` e `public/icon-512.png` para PWA/manifest

### Traduções — Admin Panel (namespaces sem versão EN)
Os seguintes namespaces existem **apenas em pt-BR** — quando o usuário está em EN, o i18next faz fallback para pt-BR. Enquanto o sistema é pt-BR only, não é bloqueante, mas deve ser resolvido antes de internacionalizar:
- [ ] `admin-panel-activities.json` (en)
- [ ] `admin-panel-activities-create.json` (en)
- [ ] `admin-panel-activities-edit.json` (en)
- [ ] `admin-panel-gamification-profiles.json` (en)
- [ ] `admin-panel-gamification-profiles-create.json` (en)
- [ ] `admin-panel-gamification-profiles-edit.json` (en)
- [ ] `admin-panel-submissions.json` (en)
- [ ] `admin-panel-submissions-create.json` (en)
- [ ] `admin-panel-submissions-edit.json` (en)
- [ ] `admin-panel-transactions.json` (en)
- [ ] `admin-panel-transactions-create.json` (en)
- [ ] `admin-panel-transactions-edit.json` (en)

---

## 🟡 Importante — Próximo ciclo

### Infra / Deploy
- [ ] **Deploy backend na VM** — mudanças de hoje (R2 público, upload de comprovante) ainda não foram para produção
- [ ] **E-mail SMTP em produção** — sem isso o fluxo de cadastro (confirmação de e-mail) não funciona em prod. Configurar provedor: Mailgun, Resend ou SendGrid. Vars: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_DEFAULT_EMAIL`
- [ ] **Apagar arquivo do R2 quando submissão for reprovada** — ao aprovar/rejeitar, se `proofUrl` aponta para o R2 e o status for REJECTED, deletar o objeto do bucket para não acumular storage desnecessário

### Health Monitoring — Alertas de limites dos serviços gratuitos
Os serviços abaixo têm cotas no plano free. O admin dashboard precisa exibir avisos visuais quando estiver próximo ou esgotado.

- [ ] **Brevo (e-mail)** — limite de 300 emails/dia no free. Backend deve consultar `GET https://api.brevo.com/v3/account` (campo `plan[].credits`) e expor em `GET /admin/health`. Frontend exibe alerta se uso > 80% da cota diária
- [ ] **Cloudflare R2 (storage)** — 10 GB free. Expor tamanho total do bucket via `GET /admin/health` (usando o SDK do R2/S3 com `listObjectsV2` + soma de `Size`). Alerta se > 8 GB
- [ ] **Neon (banco)** — 0,5 GB free no plano Neon Free. Expor tamanho do banco via query `SELECT pg_database_size(current_database())`. Alerta se > 400 MB
- [ ] **Endpoint `GET /admin/health`** — agregar os três checks acima num único endpoint protegido por role admin. Retornar `{ email: { used, limit, pct }, storage: { usedBytes, limitBytes, pct }, database: { usedBytes, limitBytes, pct } }`
- [ ] **Card "Saúde dos Serviços" no admin dashboard** — exibir os três indicadores com barra de progresso colorida (verde < 60%, amarelo 60–85%, vermelho > 85%) e mensagem de alerta se algum estiver crítico

### Sistema de Badges — Arquitetura completa
Badges têm 4 categorias. `imageUrl` é sempre opcional — o badge pode ser concedido sem arte e exibido com um placeholder. A arte é adicionada depois via edição.

**Categorias e funcionamento:**

- **`MILESTONE`** — Admin cria uma vez com threshold. Sistema concede automaticamente após submissão aprovada.
  - Exemplos de seeds a criar: "Primeira Contribuição" (1 aprovada), "Contribuidor Frequente" (10), "Veterano" (50), "Lenda" (100), "100 XP", "500 XP", "1000 XP", "5000 XP", "Generoso" (50 tokens enviados)

- **`RANKING`** — Admin pré-cria os badges de cada posição e configura qual badge representa qual posição (`position: 1`, `position: 2`, `position: 3`). Cron job roda no último dia do mês/ano, olha o `currentMonthlyXp`/`currentYearlyXp`, e concede o badge correto para cada posição.
  - Exemplos de seeds: "🥇 Campeão Mensal", "🥈 Vice Mensal", "🥉 3º Mensal", "🏆 Campeão Anual", "🥈 Vice Anual", "🥉 3º Anual"
  - Backend: adicionar `criteriaConfig: { type: 'monthly_ranking' | 'annual_ranking', position: 1 | 2 | 3 }` + cron job no NestJS com `@nestjs/schedule`

- **`PARTICIPATION`** — Admin cria com threshold em meses. Sistema avalia ao atingir tempo de cadastro.
  - Exemplos de seeds: "1 Mês na Comunidade", "6 Meses", "1 Ano", "2 Anos"
  - Novo critério `membership_months` no `BadgeEvaluatorService`

- **`SPECIAL`** — Sem critério. Admin concede manualmente para usuários específicos.
  - Exemplos de seeds sem arte: "Fundador", "Palestrante", "Organizador", "Mentor"

**O que implementar no backend:**
- [ ] Adicionar campo `category` (`MILESTONE` | `RANKING` | `PARTICIPATION` | `SPECIAL`) na entidade `Badge`
- [ ] Novo critério `membership_months` no `BadgeEvaluatorService`
- [ ] Cron job mensal/anual para badges de ranking (usar `@nestjs/schedule` + `@Cron`)
- [ ] Migração de banco para o campo `category`

**O que implementar no frontend (admin):**
- [ ] CRUD de badges no admin panel com seletor de categoria e critério
- [ ] Para RANKING: configurar qual badge = qual posição (1º, 2º, 3º) do mensal/anual

**O que implementar no frontend (usuário):**
- [ ] Seção de badges no perfil público, agrupados por categoria, com placeholder quando sem arte
- [ ] Seção "Conquistas" no dashboard mostrando badges do próprio usuário
- [ ] Notificação "Você ganhou o badge X!" (já existe o sistema de notificações)

### Seeds de badges para o lançamento
- [ ] **Criar seeds no banco** com todos os badges acima (sem `imageUrl`) antes de ir ao ar
- [ ] **Criar missões na plataforma** para a comunidade produzir as artes dos badges — uma missão por tipo de badge, com especificações técnicas claras (tamanho, formato, estilo). O vencedor de cada missão tem sua arte aprovada e usada oficialmente. As missões serão criadas pelo admin logo após o lançamento.

### Features pendentes (backend pronto, UI faltando)
- [x] **US-20B — Combobox de username na transferência de tokens** — implementado
- [ ] **US-19 — Modal de penalidade admin** — botão "Aplicar Penalidade" no perfil do usuário no admin panel → modal com `amount` + `reason` → `POST /gamification-profiles/:id/penalty`
- [ ] **US-28/29/30 — Sistema de Badges** — ver seção "Sistema de Badges" acima
- [ ] **US-32 — Dashboard de métricas admin** — 8 cards com dados de `GET /admin/metrics` (usuários, submissões, XP, tokens) + card de saúde dos serviços

### Marca e Apresentação
- [x] Revisar landing page — stats agora dinâmicos (membros e atividades reais da API)
- [ ] Atualizar a citação no `auth-layout.tsx` (coluna esquerda do login) com depoimento real de membro
- [ ] Verificar se o logo mark fica bem no modo escuro da navbar (svg transparente sobre bg escuro)

### Privacy Policy
- [ ] Revisar todo o conteúdo de `privacy-policy.json` (pt-BR e en) — textos ainda são genéricos de template, datas e URLs precisam ser atualizadas
- [ ] Atualizar data "Última atualização" no `privacy-policy.json`

### Metadata / SEO
- [ ] Adicionar `description` global no `generateMetadata` do layout (`layout.tsx`) com o slogan
- [ ] Adicionar `openGraph` global no layout (imagem OG padrão quando não há username)
- [ ] Verificar URL canônica no OG (`legado.devstocantins.com.br` ou novo domínio)
- [ ] Revisar `api/og/route.tsx` — ainda usa `legado.devstocantins.com.br` como URL no rodapé

### Dashboard
- [ ] `dashboard/page-content.tsx` — verificar se todos os textos de cards/stats usam traduções ou são hardcoded

---

## 🟢 Melhorias — Backlog

### Internacionalização
- [ ] Auditar todos os componentes por textos hardcoded em pt-BR que deveriam usar `t()`
- [ ] `app-bar.tsx` — labels de navegação são hardcoded; considerar usar `t("common:navigation.xxx")`
- [ ] `leaderboard/page-content.tsx` — labels de tabs (Mensal, Anual, Hall da Fama) são hardcoded
- [ ] Confirmar que `confirm-dialog.json` (en) está completo

### Tela de Login/Cadastro
- [ ] Considerar exibir o logo completo (com texto "legado.dev") na coluna esquerda em vez de apenas o mark + texto separado

### Admin Panel
- [ ] Revisar se `admin-panel-home.json` (pt-BR e en) reflete o nome correto do sistema
- [ ] Verificar páginas do admin panel para textos hardcoded restantes

---

## 📌 Contexto de Produto

**Por que "legado"?**  
Inversão da conotação negativa de "código legado" para seu significado original: aquilo que você constrói e que sobrevive ao tempo. A plataforma é um cofre estrutural de longo prazo do impacto do desenvolvedor na comunidade — não um feed passageiro.

**Por que ".dev"?**  
Ancora a plataforma na cultura técnica. Não é rede social genérica; é ambiente com rigor, validação de pares e cultura dev.

**Slogan: "A sua história não será esquecida"**  
Contrato com o usuário. Ataca a dor do herói silencioso que carrega o piano sem reconhecimento. Justifica o mecanismo pesado de aprovação — se vamos eternizar algo, precisa ser real.
