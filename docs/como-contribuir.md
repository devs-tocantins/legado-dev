# Como Contribuir

Bem-vindo, dev! Este guia define o fluxo de trabalho para contribuir com o frontend do Motor de Engajamento.

---

## Regras Inegociáveis

- **Nunca commite direto na `main`**
- **Cada issue = uma branch = um Pull Request**
- **Todo commit deve seguir o padrão semântico**
- **O PR só é mergeado com a aprovação de um mantenedor**

---

## Fluxo de Trabalho

### 1. Escolha uma Issue

Acesse o board do projeto no GitHub e escolha uma issue disponível. Verifique se ninguém já está trabalhando nela (campo "Assignees").

### 2. Crie sua Branch

```bash
git checkout -b feature/issue-42-tela-de-ranking
```

Padrão de nomenclatura:

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Nova funcionalidade | `feature/` | `feature/issue-10-tela-dashboard` |
| Correção de bug | `fix/` | `fix/issue-15-erro-submit-formulario` |
| Refatoração | `refactor/` | `refactor/issue-8-componentizar-ranking` |
| Documentação | `docs/` | `docs/issue-5-atualizar-readme` |

### 3. Desenvolva

Leia a documentação relevante antes de escrever código:
- [Arquitetura](arquitetura.md) — como criar páginas, proteção de rotas, i18n
- [API do Backend](api.md) — quais endpoints consumir
- [Formulários](formularios.md) — padrões de forms

### 4. Commits Semânticos

```bash
git commit -m "feat: adiciona tela de dashboard com XP mensal"
git commit -m "fix: corrige redirecionamento após login com Google"
git commit -m "chore: atualiza variáveis de ambiente no example.env.local"
git commit -m "docs: documenta endpoints de submissão"
```

| Prefixo | Quando usar |
|---------|-------------|
| `feat:` | Nova funcionalidade visível ao usuário |
| `fix:` | Correção de bug |
| `chore:` | Configuração, build, dependências |
| `refactor:` | Reestruturação sem mudança de comportamento |
| `docs:` | Apenas documentação |
| `style:` | Formatação, espaçamento (sem mudança de lógica) |
| `test:` | Adição ou correção de testes |

### 5. Abra o Pull Request

```bash
git push origin feature/issue-42-tela-de-ranking
```

No GitHub, abra o PR para a branch `main` e:
- Referencie a issue no corpo: `Closes #42`
- Descreva o que foi feito e como testar
- Adicione screenshots se for mudança visual

---

## Iniciando uma Tarefa com IA (Prompt para Devs Juniores)

Ao puxar uma issue, abra um chat com sua IA de preferência e use este prompt:

```
Você é meu par de programação Sênior especializado em Next.js e React.

Contexto do Projeto:
Estamos desenvolvendo o frontend do Motor de Engajamento da comunidade Devs Tocantins.
Stack: Next.js (App Router), TypeScript, Material UI, React Hook Form, React Query, i18n (pt-BR padrão).

INSTRUÇÃO OBRIGATÓRIA:
Antes de escrever código, leia os arquivos na pasta docs/ deste repositório:
- docs/arquitetura.md (padrão de páginas, proteção de rotas, i18n)
- docs/api.md (endpoints disponíveis do backend)
- docs/formularios.md (padrão de formulários com React Hook Form)

Regras do projeto:
- Toda nova página tem dois arquivos: page.tsx (Server Component) e page-content.tsx (Client Component)
- Páginas protegidas usam o HOC withPageRequiredAuth
- Toda string visível ao usuário usa i18n (nunca hardcode texto em PT ou EN diretamente no JSX)
- Chamadas de API usam useFetch + React Query

A tarefa de hoje: [descreva aqui a issue que você está trabalhando]

Antes de codar:
1. Confirme que entendeu a arquitetura do projeto
2. Liste os arquivos que você vai criar/modificar
3. Qual endpoint da API vamos consumir?
```

---

## Rodando os Testes E2E

```bash
# Instale os browsers do Playwright (apenas na primeira vez)
npx playwright install

# Com o servidor de desenvolvimento rodando em outra aba:
npm run dev

# Execute os testes
npx playwright test --ui
```

---

## Checklist antes de Abrir o PR

- [ ] O código compila sem erros (`npm run build`)
- [ ] Sem erros de lint (`npm run lint`)
- [ ] Traduções criadas em `pt-BR/` **e** `en/`
- [ ] Página protegida usa `withPageRequiredAuth`
- [ ] Nenhum texto hardcoded em português ou inglês no JSX (tudo via `t("chave")`)
- [ ] A issue está referenciada no PR (`Closes #N`)

---

Anterior: [Formulários](formularios.md)
