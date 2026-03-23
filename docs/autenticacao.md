# Autenticação

## Provedores Suportados

| Provedor | Status |
|----------|--------|
| E-mail e Senha | ✅ Ativo |
| Google OAuth | ✅ Ativo (requer configuração) |
| Facebook / Apple / Twitter | ❌ Removidos |

---

## Fluxo por E-mail e Senha

```
[Usuário]  →  POST /api/v1/auth/email/login  →  [Backend]
                                               ↓
                                     Retorna { token, refreshToken, user }
                                               ↓
                         Frontend armazena tokens e redireciona
```

O token JWT é armazenado pelo `AuthProvider` (`src/services/auth/`). Todas as requisições subsequentes enviam o token no header `Authorization: Bearer <token>`.

---

## Fluxo com Google OAuth

```
[Usuário clica "Entrar com Google"]
         ↓
[Google SDK autentica e retorna idToken]
         ↓
POST /api/v1/auth/google/login  { idToken }
         ↓
[Backend valida com Google e retorna JWT da plataforma]
         ↓
[Frontend armazena tokens e redireciona]
```

### Configurando o Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie ou selecione um projeto → **APIs e Serviços** → **Credenciais**
3. Copie o **Client ID**
4. Em **Origens JavaScript autorizadas**, adicione:
   - `http://localhost` (desenvolvimento)
   - `http://localhost:3001` (porta do Next.js local)
   - O domínio de produção quando aplicável
5. Cole o Client ID no `.env.local`:

```env
NEXT_PUBLIC_IS_GOOGLE_AUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id-aqui
```

---

## Refresh Token

O backend emite junto do `token` (curta duração) um `refreshToken` (longa duração).

Quando o `token` expirar:
1. O `AuthProvider` detecta o erro 401
2. Chama automaticamente `POST /api/v1/auth/refresh` com o `refreshToken`
3. Recebe novos tokens e refaz a requisição original

Esse fluxo é transparente para os componentes da UI — o `useFetch` do projeto já cuida disso.

---

## Logout

O logout chama `DELETE /api/v1/auth/logout`, invalidando a sessão no backend. O frontend então limpa os tokens armazenados.

---

## Proteção de Rotas

Veja a seção de proteção de rotas em [Arquitetura](arquitetura.md#proteção-de-rotas).

---

## Perguntas Frequentes

**P: Posso usar o JWT mesmo após fazer logout?**

O token JWT é stateless — uma vez emitido, é tecnicamente válido até expirar (15 minutos por padrão). Porém, o `refreshToken` é invalidado no logout. Sem refresh, em até 15 minutos o usuário perde o acesso.

**P: Como acesso o usuário logado em um componente?**

```tsx
import useAuth from "@/services/auth/use-auth";

function MeuComponente() {
  const { user } = useAuth();
  return <p>Olá, {user?.firstName}</p>;
}
```

---

Anterior: [Arquitetura](arquitetura.md) | Próximo: [API do Backend](api.md)
