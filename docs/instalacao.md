# Instalação e Execução

## Pré-requisitos

- Node.js 18+
- npm
- Backend da API rodando (veja `docs-backend/installing-and-running.md`)

---

## Rodando em Desenvolvimento

1. **Clone o repositório**

   ```bash
   git clone <url-do-repo> front-engajamento
   cd front-engajamento
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   ```bash
   cp example.env.local .env.local
   ```

   Edite o `.env.local` conforme necessário (veja a seção abaixo).

4. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

   O app estará disponível em `http://localhost:3001`.

---

## Variáveis de Ambiente

O arquivo `.env.local` **não vai para o git** (já está no `.gitignore`). Use o `example.env.local` como referência.

| Variável | Descrição | Valor padrão |
|----------|-----------|--------------|
| `NEXT_PUBLIC_API_URL` | URL base da API do backend | `http://localhost:3000/api` |
| `NEXT_PUBLIC_IS_GOOGLE_AUTH_ENABLED` | Habilita botão de login com Google | `false` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID do Google OAuth | vazio |
| `NEXT_PUBLIC_IS_SIGN_UP_ENABLED` | Habilita tela de cadastro | `true` |
| `NEXT_PUBLIC_FILE_DRIVER` | Driver de armazenamento de arquivos | `local` |

> **Atenção:** A API do backend por padrão roda na porta `3000`. Se você mudar a porta, atualize `NEXT_PUBLIC_API_URL`.

---

## Build de Produção

```bash
npm run build
npm run start
```

---

## Linting

```bash
npm run lint
```

---

Anterior: [Introdução](introducao.md) | Próximo: [Arquitetura](arquitetura.md)
