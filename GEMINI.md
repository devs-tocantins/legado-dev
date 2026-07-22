# front-engajamento — guia para agentes de IA (Gemini CLI)

Frontend Next.js (App Router) do legado.dev, deploy via Vercel. Repo remoto
real: `devs-tocantins/legado-dev` (o `origin` local aponta pra
`front-engajamento`, o GitHub redireciona).

## `main` NÃO é protegida aqui

Diferente do backend, `git push origin main` funciona direto — não precisa
de PR pra mesclar. Mas isso não é licença pra pular verificação: rode
`npm run lint` e (se a mudança afetar algo que dê pra rodar no navegador)
verifique visualmente antes de empurrar pra `main`, porque não há branch
protection nem CI bloqueante te segurando.

- **Existe um workflow de CI (`.github/workflows/e2e.yml`) mas ele já está
  quebrado há várias rodadas antes de qualquer mudança sua** — ele testa
  contra um backend genérico de outro projeto (`brocoders/nestjs-boilerplate`,
  resquício do boilerplate original), não contra a API real. Um "❌ E2E tests"
  na aba de checks é esperado e não indica que sua mudança quebrou algo.
  Confirme com `gh run list --workflow=e2e.yml --limit 5` se quiser comparar
  com o histórico.

## `.env.local` aponta pro backend local, não produção

`NEXT_PUBLIC_API_URL=http://localhost:3000` — pra rodar o front local contra
dados reais, é preciso o backend rodando localmente também (que por sua vez
lê do Neon/R2 de produção — mesmo cuidado do outro repo: leitura é segura,
escrita não é sem confirmar antes).

## Fluxo de trabalho

```
git status --short          # sempre confira antes de commitar
git add <arquivos específicos>
git commit -m "..."
git push origin main
```

Se a mudança for grande/arriscada o suficiente pra merecer revisão, use
branch + PR do mesmo jeito que no backend (`gh pr create`), mas isso é
opcional aqui, não obrigatório.

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

1. Diagnostique a causa raiz antes de mexer.
2. Faça a menor mudança que resolve.
3. Rode lint + tsc antes de commitar.
4. Push direto em `main` é permitido aqui, mas prefira relatar o que vai
   fazer antes de mudanças grandes/arriscadas (deletar features, mudar
   modelo de dados no front, etc.) — nem tudo que é tecnicamente permitido
   deveria ser feito sem avisar.
