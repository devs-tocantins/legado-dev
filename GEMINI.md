# front-engajamento — guia para agentes de IA (Gemini CLI)

Frontend Next.js (App Router) do legado.dev, deploy via Vercel. Repo remoto
real: `devs-tocantins/legado-dev` (o `origin` local aponta pra
`front-engajamento`, o GitHub redireciona).

## `main` agora É protegida (desde 2026-07-22) — nada de push direto

Igual ao backend: `git push origin main` é rejeitado. Fluxo obrigatório:

```
git checkout -b fix/nome-descritivo
# ... mudanças ...
git add <arquivos específicos>   # nunca `git add -A`/`git add .` sem checar antes
git commit -m "..."
git push -u origin fix/nome-descritivo
gh pr create --title "..." --body "..."
```

O check obrigatório é o job `build` do workflow **"Frontend CI"**
(`.github/workflows/ci.yml` — lint + `tsc --noEmit`), não o `e2e.yml` antigo.
Espere ele ficar verde:

```
gh pr checks <numero-do-pr>
```

Só então mescle:

```
gh pr merge <numero-do-pr> --merge --delete-branch
```

**Nunca faça `git push --force`, `git reset --hard`, ou pule hooks
(`--no-verify`) sem autorização explícita do usuário no chat.**

- **Existe um workflow de CI antigo (`.github/workflows/e2e.yml`) que já está
  quebrado há várias rodadas, sem relação com sua mudança** — ele testa
  contra um backend genérico de outro projeto (`brocoders/nestjs-boilerplate`,
  resquício do boilerplate original), não contra a API real. Ele NÃO é o
  check obrigatório (só o `build` do `ci.yml` é) — um "❌ E2E tests" na aba
  de checks é esperado e não bloqueia o merge nem indica que sua mudança
  quebrou algo.

## `.env.local` aponta pro backend local, não produção

`NEXT_PUBLIC_API_URL=http://localhost:3000` — pra rodar o front local contra
dados reais, é preciso o backend rodando localmente também (que por sua vez
lê do Neon/R2 de produção — mesmo cuidado do outro repo: leitura é segura,
escrita não é sem confirmar antes).

## Testes e lint

```
npm run lint
npx tsc --noEmit -p tsconfig.json
```

Não existe suíte de testes unitários confiável rodando neste repo hoje (só
os Playwright e2e já quebrados, ver acima). Lint + type-check é a rede de
segurança real antes de subir código.

## Rodando localmente

Servidor dev: `npm run dev -- -p 3001` (porta 3001, não a 3000 padrão do
Next — já está reservada pro backend local). Se a porta já estiver em uso
por um processo travado de uma sessão anterior, mate e suba de novo antes
de assumir que o app está fora do ar.

## Se te pedirem pra "corrigir" algo sozinho

1. Diagnostique a causa raiz antes de mexer (não aplique patch sem entender
   o porquê).
2. Faça a menor mudança que resolve, sem refatorações não pedidas.
3. Rode lint + tsc localmente antes de commitar.
4. Siga o fluxo de branch/PR acima — nunca commite direto em `main`.
5. Depois de abrir o PR, espere a CI e reporte o resultado antes de mesclar
   sozinho, a menos que o usuário já tenha autorizado merge solo sem revisão
   humana (isso já foi autorizado nesta equipe, mas espere a CI mesmo assim).
