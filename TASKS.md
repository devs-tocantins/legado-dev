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

### Backend (`api-engajamento`)

- [ ] **[IDOR] `PATCH /v1/submissions/:id` sem verificação de propriedade**
  - Qualquer usuário autenticado pode alterar o `proofUrl` de submissões de outros usuários
  - Arquivo: `src/submissions/submissions.controller.ts:167` e `submissions.service.ts:145`
  - Fix: passar `req.user.id` ao service e verificar se a submission pertence ao usuário antes de atualizar

- [ ] **[IDOR] `PATCH /v1/gamification-profiles/:id` sem verificação de propriedade**
  - Qualquer usuário autenticado pode alterar o `username` do perfil de outro usuário
  - Arquivo: `src/gamification-profiles/gamification-profiles.controller.ts:151`
  - Fix: restringir endpoint a `admin` via `RolesGuard` (uso normal já coberto pelo `PATCH /me`) ou adicionar checagem de ownership no service

- [ ] **[AUTH] `GET /v1/files/:path` sem autenticação**
  - Endpoint de download de arquivos não tem guard JWT — qualquer pessoa não autenticada consegue baixar arquivos enviados (comprovantes, fotos)
  - Arquivo: `src/files/infrastructure/uploader/local/files.controller.ts:57`
  - Fix: adicionar `@UseGuards(AuthGuard('jwt'))` se os arquivos não são públicos por design

### Frontend (`front-engajamento`)

- [ ] **[Open Redirect] `returnTo` sem validação em `with-page-required-guest.tsx:24`**
  - Parâmetro `?returnTo=https://site-externo.com` redireciona o usuário para fora do domínio após login
  - Fix: validar que o valor começa com `/` e não com `//`
    ```ts
    const raw = params.get("returnTo") ?? `/${language}/dashboard`;
    const returnTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : `/${language}/dashboard`;
    ```

- [ ] **[Insecure Storage] Tokens JWT armazenados em cookie acessível via JS (`auth-tokens-info.ts:11`)**
  - `js-cookie` no browser nunca cria cookies `HttpOnly` — qualquer XSS (CDN comprometido, dependência maliciosa) pode roubar token e refreshToken
  - Fix ideal: mover gestão de sessão para cookie `HttpOnly` setado pelo backend
  - Fix temporário: adicionar `{ secure: true, sameSite: 'strict' }` ao `Cookies.set()`

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

### Marca e Apresentação
- [ ] Revisar landing page (`page-content.tsx`) — textos e stats ainda genéricos (120+ membros, 34 tipos etc.) — atualizar com dados reais ou remover counters
- [ ] Atualizar a citação no `auth-layout.tsx` (coluna esquerda do login) para algo representativo do legado.dev
- [ ] Verificar se o logo mark fica bem no modo escuro da navbar (svg transparente sobre bg escuro)
- [ ] Criar versão light do logo mark para uso no painel esquerdo do auth (atualmente usa o mesmo svg)

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
