# Briefing — Experiência das Trilhas de Aprendizado (legado.dev)

## Como usar este documento

Você é especialista em design de produto (UX/UI). Este documento te dá o
**contexto e os conceitos** de uma funcionalidade nova. **De propósito, ele não
diz nada sobre o visual** — cor, layout, tipografia, ilustração, navegação: tudo
isso é com você. Queremos que **você proponha** a experiência e a direção visual,
com originalidade e justificando o raciocínio. Não queremos clonar nenhum app
existente; queremos uma linguagem própria.

Comece pelo conceito da experiência; depois a gente detalha telas.

## O que é o legado.dev

Uma comunidade de desenvolvedores (Brasil), com um sistema de gamificação. O
público são **devs, muitos em início de carreira**, querendo o primeiro emprego
ou evoluir na profissão (estágio → júnior → pleno → sênior). Não há dinheiro para
prêmios: o valor para o membro precisa vir de **crescimento, reconhecimento e
pertencimento**, não de recompensa financeira.

Tom desejado: **adulto, profissional e aspiracional** — gente grande buscando
emprego. Recompensador e motivador, mas **nada infantil**.

## O problema que essa funcionalidade resolve

Hoje as pessoas se cadastram, testam e somem: o sistema entrega pouco valor
pessoal imediato. A pessoa não sabe o que fazer nem por quê. Falta um motivo
claro e contínuo pra voltar.

## A funcionalidade: Trilhas de Aprendizado

**Conceito central:** um caminho guiado que leva o dev, passo a passo, até níveis
de **prontidão de carreira** (ex.: "pronto para estagiar"), acumulando **prova de
trabalho real, verificada pela comunidade**. A plataforma **não ensina** — ela
**guia** (aponta recursos gratuitos, propõe desafios) e **valida**.

### Como funciona (conceito, sem visual)

- Uma trilha (ex.: "Backend inicial") é uma sequência de **etapas**; cada etapa
  tem **marcos**.
- Tipos de marco: **consumir** um recurso (curso/artigo/vídeo indicado);
  **provar fazendo** (ex.: subir uma API, abrir um Pull Request real) enviando
  comprovante; um **quiz** rápido; **participar de um evento**; **concluir um
  curso** do catálogo.
- É **guiada e progressiva** — em geral se avança na ordem. Mas quem já domina um
  marco pode **provar direto e pular** (test-out).
- As provas são **validadas por membros mais experientes** da comunidade, com
  critérios claros.
- Ao concluir uma etapa, a pessoa ganha um **selo/título** daquele nível.
- Todo o progresso e as provas ficam num **perfil público** que funciona como
  **portfólio/credencial** — algo que a pessoa tem orgulho de mandar para um
  recrutador ("olha, aqui prova o que eu sei fazer").

### Duas dimensões de pontuação (conceito)

Existem duas coisas distintas que a experiência deve deixar claras como
diferentes:
- **Progresso pessoal** — o quanto a pessoa evoluiu na trilha.
- **Contribuição à comunidade** — o quanto ela ajudou os outros.

## Objetivos da experiência (o que o design PRECISA alcançar)

Estes são os resultados desejados — **não** instruções de como fazer:

1. **O próximo passo é sempre óbvio.** O maior inimigo é a paralisia da tela
   cheia de opções. A qualquer momento deve existir **uma** ação clara e pequena
   à frente.
2. **Progresso tangível e motivador.** A pessoa sente que avança e percebe o
   quão perto está do próximo título.
3. **Baixa fricção para registrar/provar.** Enviar um comprovante ou marcar um
   passo como feito precisa ser rápido, sem burocracia.
4. **Sensação de evolução de carreira, não de joguinho.** Público adulto buscando
   emprego — a experiência deve ser séria o bastante para dar orgulho, sem perder
   o lado recompensador.
5. **Momentos de conquista.** Concluir um marco/etapa deve ser gratificante e,
   idealmente, **compartilhável** (a pessoa quer poder postar "consegui").
6. **A credencial/portfólio precisa transmitir confiança.** Quem olha de fora (um
   recrutador) bate o olho e entende o que a pessoa provou.
7. **Orientação constante.** A qualquer momento a pessoa entende onde está na
   jornada, o que falta e por que aquele passo importa para a carreira dela.

## Restrições técnicas (só o essencial)

- Aplicação **web** (React/Next.js, Tailwind), com **tema claro e escuro**, e
  precisa **funcionar bem no celular**.
- Precisa ser **leve** (roda em infraestrutura modesta) — evite propostas que
  dependam de recursos pesadíssimos. Ainda assim, priorize propor a melhor
  experiência; performance a gente afina depois.
- Já existe uma identidade visual no produto. Se você quiser vê-la para manter
  coerência — ou para propor uma evolução dela — é só pedir. Mas fique à vontade
  para propor do zero.

## O que NÃO queremos

- **Cópia descarada** de apps famosos de idioma/gamificação (nada de clonar o
  "caminho de bolinhas"). Buscamos uma linguagem própria e original.
- **Tom infantil.** É para gente grande querendo emprego.

## O que pedimos a você

Proponha a **experiência de como o usuário vê e percorre uma trilha** — desde
descobrir e entrar numa trilha, entender onde está, saber o próximo passo,
cumprir um marco (consumir ou provar), sentir o progresso, até ganhar o título e
ver sua credencial pública.

Traga a **direção de experiência e visual** que você considera melhor, com o
**raciocínio** por trás de cada escolha. Se quiser, apresente mais de uma
direção. Pode fazer perguntas antes de começar, se precisar.
