# Plano de Pendências — legado.dev

## Estado atual (2026-04-17)

- **Frontend** (Vercel): atualizado, branch `main` em produção.
- **Backend** (VM `136.248.75.34`): desatualizado. O branch `feat/milestone-4-community-features` tem ~20 commits que **nunca foram deployados**. O código na VM ainda é a versão anterior ao milestone 4.
- **VM**: 954 MB RAM (495 MB disponível), 45 GB disco (33 GB livre).
- **Storage**: arquivos salvos em `./files` no disco do container — somem ao recriar o container. Sem solução persistente configurada ainda.

---

## Problema crítico identificado

Contas criadas pelo cadastro normal **não recebem gamification profile** na versão deployada da API. Isso faz com que:
- A tela de editar perfil não mostre o campo de foto (GitHub username) nem o username da comunidade.
- O perfil público `/u/username` não existe.

**Causa raiz:** o backend antigo não criava o perfil de gamificação automaticamente no signup. A versão nova (feat/milestone-4-community-features) faz isso — mas ainda não foi deployada.

**Solução imediata aplicada:** criação manual do perfil no banco para a conta de teste.  
**Solução permanente:** deploy do backend atualizado (item 1 abaixo).

---

## Pendências em ordem de prioridade

### 1. Deploy do backend atualizado *(urgente — desbloqueia tudo)*

O branch `feat/milestone-4-community-features` precisa ser enviado à VM via rsync e reconstruído.

Funcionalidades que chegam com esse deploy:
- Gamification profile criado automaticamente no cadastro (com username)
- Endpoint `GET /gamification-profiles/check-username/:username`
- Campo `githubUsername` no perfil
- Sistema de badges completo (criar, conceder, avaliar automaticamente)
- Dashboard de métricas admin (`GET /admin/metrics`)
- Campo `isBanned` + bloqueio de login para usuários banidos
- Campo `requiresDescription` nas atividades
- Proteções RBAC em submissions e transactions
- Filtro de busca no `GET /gamification-profiles`

**Passos:**
```bash
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='dist' \
  --exclude='.env' --exclude='.env.prod' --exclude='ssh-key-*.key' \
  -e "ssh -i ssh-key-2026-04-01.key" \
  . ubuntu@136.248.75.34:~/app/

ssh -i ssh-key-2026-04-01.key ubuntu@136.248.75.34 \
  "cd ~/app && sudo docker compose -f docker-compose.prod.yaml down && \
   sudo docker compose -f docker-compose.prod.yaml build --no-cache && \
   sudo docker compose -f docker-compose.prod.yaml up -d"
```

---

### 2. Corrigir regex de username no backend

O frontend já aceita hífen no username (`^[a-z0-9_-]+$`), mas o backend ainda valida com `^[a-z0-9_]+$` (sem hífen).

**Arquivo:** `src/gamification-profiles/gamification-profiles.service.ts` (ou onde a validação de username está no DTO).

Trocar:
```typescript
/^[a-z0-9_]+$/  →  /^[a-z0-9_-]+$/
```

Isso deve ser feito **antes do deploy** do item 1.

---

### 3. Storage — solução sem custo *(Cloudflare R2)*

**Problema:** arquivos enviados para a API ficam em `./files` dentro do container Docker. Ao recriar o container, todos os arquivos somem. Além disso, a VM tem pouca RAM para rodar um serviço de storage local (MinIO consumiria ~200 MB a mais).

**Solução recomendada: Cloudflare R2**

- **Custo:** grátis até 10 GB de storage e 1 milhão de operações por mês.
- **Compatibilidade:** API 100% compatível com S3 — o backend já tem suporte a S3 (só trocar as env vars).
- **Sem taxa de egress** (diferente do AWS S3).

**O que você precisa fazer:**
1. Criar conta em [cloudflare.com](https://cloudflare.com) (se não tiver)
2. Acessar o painel → R2 → Criar bucket (ex: `legado-dev-files`)
3. Gerar um API Token com permissão R2 → copiar `Access Key ID` e `Secret Access Key`
4. Pegar o `Account ID` (aparece no painel do R2)

**O que eu faço depois:**
- Atualizar o `.env.prod` na VM com as credenciais R2
- Trocar `FILE_DRIVER=local` para `FILE_DRIVER=s3`
- Configurar o endpoint, bucket e region corretos
- Rebuild do container

**Alternativas também gratuitas (caso R2 não sirva):**
| Opção | Limite grátis | Observação |
|---|---|---|
| Cloudflare R2 | 10 GB + 1M ops | Melhor opção |
| Backblaze B2 | 10 GB | API S3-compatible |
| Supabase Storage | 1 GB | Bom se já usar Supabase |

---

### 4. Merge feat → main no backend

O branch `feat/milestone-4-community-features` nunca foi mergeado na `main`. Após o deploy estar estável, abrir PR e mergear.

---

### 5. Configurar domínio definitivo

A URL atual da API é `https://136.248.75.34.nip.io` — funciona, mas é baseada em IP. Quando o domínio `legado.devstocantins.com.br` estiver apontando para a VM, atualizar:
- Nginx: novo `server_name`
- `.env.prod` na VM: `APP_URL` e `FRONTEND_DOMAIN`
- Variáveis de ambiente na Vercel: `NEXT_PUBLIC_API_URL`
- Certificado SSL: `sudo certbot --nginx -d legado.devstocantins.com.br`

---

## Resumo da ordem de execução

```
[x] Perfil manual criado para conta de teste (paliativo)

[ ] 1. Corrigir regex username no backend (hífen)
[ ] 2. Rsync + rebuild na VM com o branch atualizado
[ ] 3. Criar conta Cloudflare R2 (você faz)
[ ] 4. Configurar R2 no backend + rebuild final
[ ] 5. Merge feat → main no backend
[ ] 6. Configurar domínio definitivo (quando tiver o domínio)
```
