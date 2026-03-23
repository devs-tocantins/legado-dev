# Introdução

## O que é este projeto?

Este é o **Frontend do Motor de Engajamento da comunidade Devs Tocantins** — uma plataforma de gamificação que rastreia, registra e recompensa contribuições dos membros da comunidade.

O mantra do sistema: **"Se gerou valor para a comunidade, vale ponto."** Desde palestrar em um evento até ajudar um júnior no grupo do WhatsApp, toda contribuição importa.

---

## O Problema que Resolvemos

A comunidade gera valor diário — dúvidas respondidas, vagas compartilhadas, projetos open source, eventos organizados — mas esse histórico se perde em grupos de mensagens efêmeros. Não há forma centralizada de medir, reconhecer ou valorizar os membros mais ativos.

---

## A Solução

Uma plataforma onde:

- Membros **submetem provas** de atividades realizadas (artigo publicado, ajuda no Discord, presença em meetup)
- **Moderadores auditam** as submissões e aprovam ou rejeitam, ganhando pontos automáticos por isso
- O sistema mantém **rankings mensais, anuais e um Hall da Fama global**
- Membros podem transferir **Tokens de Gratidão** entre si para reconhecimento P2P

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Linguagem | TypeScript |
| UI | [Material UI (MUI)](https://mui.com/) |
| Formulários | [React Hook Form](https://react-hook-form.com/) + Yup |
| Requisições | [React Query (TanStack Query)](https://tanstack.com/query) |
| i18n | [i18next](https://react.i18next.com/) |
| Testes E2E | [Playwright](https://playwright.dev/) |

**Backend:** NestJS + PostgreSQL (TypeORM). Veja a pasta `docs-backend/` para detalhes da API.

---

## Provedores de Autenticação

O backend suporta **apenas** dois provedores. Não tente adicionar outros sem alterar o backend primeiro:

- E-mail e Senha
- Google OAuth

Facebook, Apple e Twitter foram removidos.

---

Próximo: [Instalação e Execução](instalacao.md)
