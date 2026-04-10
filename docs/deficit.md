# Documento de Déficit — Legado Tech Frontend

> Este documento lista tudo que está especificado no Design Manual mas **não pode ser implementado agora** por depender de ativos, serviços ou decisões que ainda não existem. Cada item tem: o que é, por que não dá pra fazer agora, o que é necessário para desbloquear, e o que usar de fallback no interim.

---

## DÉFICIT 1 — Logo SVG da Devs Tocantins

**O que é:** O símbolo visual proprietário da marca — o ícone que vai no AppBar, favicon, e-mails, og:image e em qualquer material de comunicação.

**Por que está bloqueado:** Não existe. Atualmente o código usa o ícone genérico `Zap` do Lucide React. O design manual especifica que o símbolo deve ter referência visual ao Tocantins e ser único, o que exige criação por um designer ou decisão do produto sobre a identidade.

**O que é necessário para desbloquear:**
- Decisão sobre a identidade visual da marca (qual referência usar — forma do estado, peixe dourado, cerrado, etc.)
- Criação do símbolo em SVG por um designer (ou uso de ferramenta como Figma + exportação)
- Versões necessárias: colorida (para fundos claros), branca (para fundos escuros), mono (para favicon)

**Fallback atual (já aplicado no plano):**
- Placeholder "DT" em `font-heading font-bold` dentro de um quadrado com borda `--primary`
- Este placeholder é digno mas temporário — não representa a marca

**Impacto se não resolvido:** Toda a identidade da plataforma fica genérica. O logo é o elemento mais visto em todas as páginas.

---

## DÉFICIT 2 — Fotografias de Eventos da Comunidade

**O que é:** Fotos reais de meetups, hackathons, palestras e eventos da Devs Tocantins para uso na landing page, página de login, seção de destaques e como capa de perfil público.

**Por que está bloqueado:** As fotos não existem ou não estão organizadas. Bancos de imagens genéricos (Unsplash, Pexels) são explicitamente proibidos pelo design manual — devem ser pessoas e momentos reais da comunidade.

**O que é necessário para desbloquear:**
- Curadoria das fotos de eventos anteriores da Devs Tocantins (WhatsApp, redes sociais, etc.)
- Mínimo necessário: 3–5 fotos de boa qualidade (mínimo 1920×1080px) em formato paisagem
- Preferência: pessoas trabalhando em laptops, apresentações, grupos interagindo
- Conversão para WebP e upload para o S3 (quando disponível) ou pasta `/public`

**Onde as fotos seriam usadas:**
1. Landing page — coluna direita do hero ou seção de destaque
2. Página de login — coluna esquerda (fundo com overlay)
3. Perfil público — faixa de capa (opcional, personalizada por usuário no futuro)

**Fallback atual:**
- Capa de perfil: pattern CSS geométrico (grid de pontos em SVG embutido)
- Login: fundo escuro sólido com o mesmo pattern
- Landing: sem imagem de destaque na coluna direita — apenas o card de ranking

**Impacto se não resolvido:** A plataforma perde o calor humano e a sensação de "comunidade real". É esteticamente aceitável com fallback, mas não é o ideal do design manual.

---

## DÉFICIT 3 — Fotografias do Tocantins (Paisagem / Cerrado)

**O que é:** Fotos de alta qualidade do estado do Tocantins — paisagem do cerrado, rio Tocantins, vista de Palmas — para uso como background de seções na landing page e CTA.

**Por que está bloqueado:** Idem ao Déficit 2. Fotos de banco de imagens não são aceitáveis.

**O que é necessário para desbloquear:**
- Fotos próprias tiradas por membros da comunidade, fotógrafos locais ou banco de imagens público específico do estado (governo do TO disponibiliza algumas)
- Formato: paisagem, mínimo 1920×1080px, WebP
- O que deve mostrar: natureza reconhecível do estado (não pode ser qualquer cidade)

**Fallback atual:**
- Seção CTA da landing: fundo `--background` simples com borda divisória
- Nenhuma foto de paisagem em uso temporariamente

---

## DÉFICIT 4 — Arte dos Badges / Conquistas

**O que é:** Artes visuais proprietárias para cada badge de conquista (ex: "Primeiro Artigo", "Top 3 Mensal", "Lenda da Comunidade"). O design manual especifica flat design com paleta limitada, não os ícones genéricos do Lucide.

**Por que está bloqueado:** As artes precisam ser criadas. Além disso, a funcionalidade de badges no backend ainda não está implementada (ver user-stories.md Épico 7).

**O que é necessário para desbloquear:**
- Backend: implementar `Badge`, `GamificationProfileBadge` e `BadgesEvaluatorService`
- Design: criar as artes de cada badge em SVG (128×128px)
- Upload das artes para o S3 e referência via `Badge.imageUrl`

**Fallback atual:**
- Componente `BadgePlaceholder` que renderiza um hexágono SVG com a inicial da conquista na cor semântica do tipo
- Esse fallback é apresentável e informativo

**Impacto se não resolvido:** A seção de badges do perfil público fica funcional mas sem personalidade visual. O conteúdo existe, mas o impacto emocional é menor.

---

## DÉFICIT 5 — Serviço de Storage (S3 / MinIO em Produção)

**O que é:** O armazenamento de objetos para upload de fotos de avatar, comprovantes de submissão e assets de badges.

**Por que está bloqueado:** Em ambiente de testes, o MinIO está configurado localmente no Docker, mas não existe um bucket S3 real em produção. O `FILE_DRIVER` precisa ser configurado como `s3-presigned` com credenciais reais da AWS ou Cloudflare R2.

**O que impacta no frontend:**
- Upload de avatar do usuário: funciona localmente (MinIO), mas em produção não tem onde salvar
- Comprovantes de submissão: idem
- Artes de badges: idem

**Funcionalidades do frontend bloqueadas por isso:**
- Upload de foto de perfil (Etapa de edição de perfil)
- Submissão de atividades com comprovante por upload direto (link URL ainda funciona)
- Exibição de badges com arte personalizada

**Fallback atual:**
- Comprovantes: aceitar apenas URL externa (link do Google Drive, YouTube, GitHub, etc.) — já implementado
- Avatar: placeholder com iniciais — já implementado
- Badges: placeholder hexagonal — será implementado

**O que é necessário para desbloquear:**
- Configuração do Bucket S3 na AWS ou Cloudflare R2
- Configuração das variáveis: `FILE_DRIVER=s3-presigned`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `AWS_S3_REGION`, `AWS_DEFAULT_S3_BUCKET`
- Configuração de CORS no bucket para aceitar requests do domínio da aplicação

---

## DÉFICIT 6 — Serviço de E-mail (SMTP em Produção)

**O que é:** Envio de e-mails transacionais para os usuários — confirmação de cadastro, recuperação de senha, notificação de submissão aprovada/rejeitada, badge de ranking conquistado.

**Por que está bloqueado:** Apenas o Maildev local (desenvolvimento) está configurado. Não existe provedor SMTP de produção configurado.

**O que impacta no frontend:**
- A tela de confirmação de e-mail (`/confirm-email`) existe mas os e-mails não chegam em produção
- Usuários em produção não conseguem confirmar e-mail → não conseguem criar `GamificationProfile` → não conseguem usar o sistema

**Funcionalidades do frontend bloqueadas por isso:**
- Fluxo completo de cadastro (o e-mail de confirmação não chega)
- Recuperação de senha
- Notificações de submissão (UX crítica para engajamento)
- E-mail de badge de ranking (Etapa 9 do backend)

**Fallback atual:** Nenhum. Este é o bloqueio mais crítico para o funcionamento em produção.

**O que é necessário para desbloquear:**
- Escolher provedor SMTP: Mailgun (gratuito até 5k/mês), Resend (gratuito até 3k/mês), SendGrid, ou SMTP próprio
- Configurar variáveis: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_DEFAULT_EMAIL`
- Criar templates dos e-mails faltantes (ver user-stories.md US-15-B, US-16, US-33)

---

## DÉFICIT 7 — Login Social (OAuth) em Produção

**O que é:** Autenticação via Google, Apple e Facebook além do login por e-mail/senha.

**Por que está bloqueado:** As credenciais OAuth (`GOOGLE_CLIENT_ID`, `APPLE_APP_AUDIENCE`, `FACEBOOK_APP_ID`) não estão configuradas.

**O que impacta no frontend:**
- Botão "Entrar com Google" na tela de login está oculto/não funciona
- Novos usuários só conseguem cadastrar via e-mail e senha

**Impacto:** Reduz a conversão de novos membros (login com Google elimina fricção). Não bloqueia o funcionamento core.

**O que é necessário para desbloquear:**
- Criar app no Google Cloud Console e extrair `GOOGLE_CLIENT_ID` e `SECRET`
- Configurar domínio autorizado no console do Google (domínio de produção)
- Criar app no Apple Developer (mais complexo, exige conta paga)

---

## DÉFICIT 8 — og:image Dinâmica (Compartilhamento de Perfil)

**O que é:** A imagem gerada dinamicamente quando um link de perfil é compartilhado no WhatsApp, LinkedIn ou Twitter, mostrando o @username, nível e XP em um card visual bonito.

**Por que está bloqueado:** Depende de:
1. O design das etapas 0–4 estar estável (não faz sentido criar a og:image com a identidade visual antiga)
2. A fonte `Space Grotesk` estar disponível no servidor para o `ImageResponse` do Next.js (requer download no build)
3. O logo SVG existir (Déficit 1 — pode usar o placeholder "DT" por ora)

**O que impacta no frontend:**
- Links de perfil colados no WhatsApp/LinkedIn aparecem sem preview visual
- Reduz significativamente o valor de "compartilhe seu perfil no LinkedIn"

**Fallback atual:** Nenhuma og:image — o WhatsApp mostra apenas a URL sem preview. Isso é aceitável temporariamente.

**O que é necessário para desbloquear:**
- Etapas 0–4 do plano concluídas (design estável)
- Download da fonte para uso serverside no Next.js `ImageResponse`

---

## DÉFICIT 9 — Histórico de Rankings e Snapshots (Novo Épico)

**O que é:** A funcionalidade de `RankingSnapshot` descrita nas user-stories (US-31 a US-34) — salvar o ranking antes do reset e exibir no perfil "Você foi Top 2 em Abril".

**Por que está bloqueado:** Não existe no backend. Nem a entidade `RankingSnapshot`, nem o CronJob que a gera, nem as rotas de consulta estão implementadas.

**O que impacta no frontend:**
- A seção "Seu histórico de ranking" no dashboard não pode ser implementada
- Badges de ranking histórico ("Top 1 — Abril 2026") não existem
- A página "Hall da Memória" (US-34) não tem dados

**Fallback atual:**
- Omitir a seção de histórico de ranking no dashboard e perfil
- Não exibir badges históricas de ranking

**O que é necessário para desbloquear:**
- Backend: criar entidade `RankingSnapshot`, migration, ajustar CronJob mensal para gerar o snapshot antes do zero
- Backend: criar rota `GET /api/v1/ranking-snapshots/me`
- Backend: criar lógica de concessão automática de badges de ranking no CronJob

---

## DÉFICIT 10 — Quotes e Depoimentos Reais de Membros

**O que é:** Citações reais de membros da comunidade para uso na coluna esquerda das páginas de login/cadastro, dando autenticidade e calor humano à plataforma.

**Por que está bloqueado:** Não foram coletadas. O design manual especifica que as quotes devem ser reais, com @username real.

**O que é necessário para desbloquear:**
- Coletar 3–5 depoimentos de membros que já usaram ou contribuíram com a plataforma
- Obter autorização para publicar nome/username
- Cada quote: texto (máximo 2 linhas), nome e @username do autor, nível atual

**Fallback atual:**
- Quote fictícia mas plausível, sem nome real: *"Ajudei um júnior a configurar o ambiente em 40 minutos. Essa conversa virou pontos."*
- Atribuição genérica: `— Membro da Devs Tocantins`

---

## Resumo de Prioridades para Desbloquear

| Déficit | Impacto | Prioridade | Responsável |
|---|---|---|---|
| 6 — E-mail SMTP | **Crítico** — sem isso o cadastro não funciona em prod | 🔴 Urgente | Infra/Dev |
| 5 — Storage S3 | **Alto** — uploads não funcionam em prod | 🟠 Alta | Infra/Dev |
| 1 — Logo SVG | **Alto** — identidade visual incompleta | 🟠 Alta | Design |
| 2 — Fotos de Eventos | **Médio** — calor humano na plataforma | 🟡 Média | Comunidade |
| 7 — OAuth Google | **Médio** — reduz fricção no cadastro | 🟡 Média | Dev |
| 8 — og:image | **Médio** — crítico para o objetivo de "currículo" | 🟡 Média | Dev (após etapa 4) |
| 4 — Arte dos Badges | **Médio** — impacto no engajamento gamificado | 🟡 Média | Design + Backend |
| 9 — RankingSnapshot | **Médio** — funcionalidade futura importante | 🟡 Média | Backend |
| 3 — Fotos Tocantins | **Baixo** — melhoria estética | 🟢 Baixa | Comunidade |
| 10 — Quotes reais | **Baixo** — melhoria de autenticidade | 🟢 Baixa | Comunidade |
