# Prompts de Imagem — Legado Tech / Devs Tocantins

> **Como usar este documento:**
> Cada seção descreve UMA imagem específica com seu contexto de uso, especificação técnica e o prompt pronto para colar em uma IA geradora de imagem (Midjourney, DALL·E 3, Firefly, Stable Diffusion, etc.).
> Para logos e ícones vetoriais, recomenda-se Midjourney v6 ou Adobe Firefly com exportação para SVG via Illustrator.

---

## IMAGEM 1 — Logo Símbolo (ícone standalone)

**Onde aparece:** AppBar em mobile, favicon, badge/emblema pequeno, cantos de og:image  
**Tamanho final:** SVG + PNG 64×64px (exportar em 2×: 128×128px)  
**Formato obrigatório:** SVG vetorial

### Contexto de design
O símbolo deve funcionar em fundo escuro (`#111411`) E em fundo claro (`#F9F8F6`), portanto precisa de uma versão monocromática. Deve incorporar sutilmente a identidade regional do Tocantins (o estado mais novo do Brasil, localizado no cerrado, banhado pelo rio Tocantins) combinada com tecnologia. Não deve parecer logo corporativo genérico.

### Prompt para Midjourney v6
```
Minimalist tech logo symbol for "Devs Tocantins" Brazilian developer community. 
Design concept: abstract mark that combines the silhouette of Tocantins state 
(a long narrow vertical shape, like a river flowing south) with a circuit node 
or terminal cursor element. Clean geometric lines, no gradients, single color 
(works in monochrome). Style: flat icon, tech startup aesthetic similar to 
Vercel or Linear logos. The shape should feel like a connection point, a 
deploy arrow, or a rising line graph — subtle reference to growth and 
contribution. Must work at 16px favicon size. White version on dark background.
--style raw --ar 1:1 --v 6
```

### Prompt alternativo (mais simples, para teste rápido)
```
Logo symbol for a Brazilian developer community in Tocantins state. 
Geometric minimal icon: angular letter D and T intertwined, 
or an abstract node/circuit board element shaped like the Tocantins river. 
Flat design, single color, no gradients, works at small sizes. 
Tech startup style, clean and modern. Black on white.
--ar 1:1 --style raw
```

---

## IMAGEM 2 — Logo Horizontal (símbolo + wordmark)

**Onde aparece:** AppBar desktop, e-mails transacionais, documentos  
**Tamanho final:** SVG + PNG 480×120px  
**Formato obrigatório:** SVG vetorial (texto como outline, não fonte embedada)

### Prompt para Midjourney v6
```
Horizontal logo lockup for "Devs Tocantins" tech community. 
Left side: small geometric icon symbol (minimalist, flat, single color). 
Right side: wordmark "Devs Tocantins" in Space Grotesk style sans-serif font, 
bold weight, tight letter spacing. 
Color: deep blue (#1D4ED8) icon + dark near-black (#111211) text. 
Clean tech aesthetic, no decorations, no tagline.
Professional developer community brand.
--ar 4:1 --style raw --v 6
```

---

## IMAGEM 3 — Logo Versão Branca

**Onde aparece:** Coluna esquerda da tela de login, og:image, fundos escuros  
**Tamanho final:** SVG  
**Nota:** É a mesma arte do Logo Horizontal, mas todas as cores substituídas por branco puro (`#FFFFFF`).

### Instrução
Usar o mesmo arquivo SVG do Logo Horizontal (Imagem 2) e:
1. Substituir todas as cores por `fill="#FFFFFF"`
2. Exportar como `logo-white.svg`

**Não é necessário gerar uma imagem nova — é só recolorir o SVG original.**

---

## IMAGEM 4 — Foto de Evento Principal

**Onde aparece:**
- Landing page: background da seção "Perfis em Destaque" (overlay escuro 50%)
- Tela de login/cadastro: coluna esquerda (overlay escuro 75%)

**Tamanho ideal:** 1920×1080px, WebP  
**Salvamento:** `public/images/event-main.webp`

### O que a foto DEVE mostrar
Pessoas reais em um evento de tecnologia — pode ser meetup, hackathon, workshop, palestra. Ambiente informal, desenvolvedor(es) com laptops, tela de projetor ao fundo, ambiente noturno ou com luz ambiente quente. Sensação de comunidade, colaboração, aprendizado. **Não usar foto de banco de imagens genérica de escritório corporativo.**

### Prompt para Midjourney v6
```
Photorealistic photo of a Brazilian developer community meetup event at night. 
Young developers (20-30 years old, diverse group) sitting in a informal venue 
with laptops open, a projection screen visible in the background showing code 
or slides. Warm lighting from above, slightly dimmed atmosphere typical of 
tech meetups. Candid, natural poses — people are engaged in conversation or 
listening to a speaker. The vibe is community, not corporate. 
Shot with 24mm lens, f/2.8, slight bokeh in background.
High quality, photojournalistic style, warm color grading.
--ar 16:9 --style raw --v 6
```

### Overlay de uso
Quando usada na landing page: CSS `rgba(17, 20, 17, 0.50)` sobre a imagem  
Quando usada no login: CSS `oklch(0.12 0.01 145 / 75%)` sobre a imagem

---

## IMAGEM 5 — Foto de Evento Secundária

**Onde aparece:** Cards de destaque na landing page, seção "Como Funciona"  
**Tamanho ideal:** 800×600px, WebP  
**Salvamento:** `public/images/event-secondary.webp`

### Prompt para Midjourney v6
```
Close-up photo of two or three young Brazilian developers collaborating 
around a laptop screen at a community event. One person is coding, 
others are looking and discussing. Warm indoor lighting, casual clothes, 
stickers on laptops visible. Feeling of pair programming or code review. 
Natural, candid moment. Shallow depth of field, warm tones.
--ar 4:3 --style raw --v 6
```

---

## IMAGEM 6 — Paisagem do Tocantins / Cerrado

**Onde aparece:**
- Seção CTA final da landing page (overlay azul `--primary` 60%)
- Faixa de capa do perfil público (overlay 30%, visual elegante)

**Tamanho ideal:** 1920×1080px, WebP  
**Salvamento:** `public/images/tocantins-landscape.webp`

### O que a foto DEVE mostrar
Paisagem reconhecível e bela do Tocantins: a cidade de Palmas ao entardecer (vista da margem do Lago de Palmas), ou o rio Tocantins visto de cima, ou a paisagem do cerrado com o céu dramático. Não usar foto clichê de guia turístico. Deve transmitir grandiosidade, orgulho regional e beleza natural genuína.

### Prompt para Midjourney v6
```
Aerial photograph of Palmas, Tocantins, Brazil at sunset. 
The city skyline with the Lago de Palmas (artificial lake) reflecting 
the golden and blue sky. Modern city surrounded by cerrado vegetation 
(typical Brazilian savanna with twisted trees and golden grass). 
Dramatic clouds, warm orange and deep blue tones in the sky. 
Ultra-wide shot, golden hour light, cinematic composition.
High resolution, no people, no text.
--ar 16:9 --style raw --v 6
```

### Variação alternativa (cerrado puro)
```
Aerial drone photo of the Brazilian cerrado landscape at sunset, 
Tocantins state. Golden savanna grasses, twisted cerrado trees (veredas), 
the Tocantins river visible in the distance, dramatic sky with storm clouds 
on the horizon. Colors: deep amber, burnt orange, dusty gold, deep blue sky. 
No people, no text, cinematic quality photo.
--ar 16:9 --style raw --v 6
```

---

## IMAGENS 7–12 — Arte dos Badges de Conquista

Cada badge é uma arte quadrada de **128×128px** (exportar em 2×: 256×256px), estilo flat design com 2–3 cores, alto contraste. Deve funcionar sobre fundo claro (`--accent-light: #FEF3C7`) e escuro (`--accent-light dark: #78350F`).

**Salvamento:** `public/images/badges/badge-[nome].png`

---

### BADGE 1 — Top 1 do Mês

**Cor principal:** Âmbar dourado `#F59E0B`  
**Significado:** Ficou em 1º lugar no ranking mensal

```
Flat design badge icon for "Top #1 Monthly Contributor" achievement. 
Style: clean geometric flat illustration, 2-3 colors only. 
Design: stylized golden trophy or crown with a subtle "1" numeral. 
Bold shapes, thick strokes, no gradients, no shadows. 
Amber/gold (#F59E0B) as primary color, dark (#111411) as outline/detail, 
white as highlight. Works on both light and dark backgrounds.
Square format, centered composition, plenty of padding.
--ar 1:1 --style raw --v 6
```

---

### BADGE 2 — Top 3 do Mês

**Cor principal:** Âmbar escuro `#B45309`  
**Significado:** Ficou no pódio (2º ou 3º) do ranking mensal

```
Flat design badge icon for "Top 3 Monthly Podium" achievement.
Style: clean geometric flat illustration, 2-3 colors only.
Design: stylized podium with three levels, or a medal shape with three 
horizontal stripes. Bronze-amber tones (#B45309), thick geometric lines, 
no gradients. Solid shapes, minimal detail.
Square format, centered, clear at 32px size.
--ar 1:1 --style raw --v 6
```

---

### BADGE 3 — Primeira Contribuição

**Cor principal:** Verde esmeralda `#059669`  
**Significado:** Primeira submissão aprovada na plataforma

```
Flat design badge icon for "First Contribution" milestone achievement.
Style: clean geometric flat illustration, 2-3 colors only.
Design: a lightning bolt (representing energy and XP) inside a circle, 
or a single star/spark shape. Emerald green (#059669) as primary color, 
dark outline. Celebratory but minimal. No gradients, no shadows.
Square format, centered composition.
--ar 1:1 --style raw --v 6
```

---

### BADGE 4 — Colaborador Ativo (nível de XP)

**Cor principal:** Azul céu `#38BDF8`  
**Significado:** Atingiu o nível "Colaborador Ativo" (500+ XP)

```
Flat design badge icon for "Active Contributor" level achievement.
Style: clean geometric flat illustration, 2-3 colors.
Design: upward arrow with small person/human silhouette, 
or an abstract "level up" symbol. Sky blue (#38BDF8) as primary, 
dark near-black as outline. Conveys growth and active participation.
No gradients, flat shapes only. Clear at small sizes.
--ar 1:1 --style raw --v 6
```

---

### BADGE 5 — Mentor (nível de XP)

**Cor principal:** Âmbar `#F59E0B`  
**Significado:** Atingiu o nível "Mentor" (4000+ XP)

```
Flat design badge icon for "Mentor" level achievement in a tech community.
Style: clean geometric flat illustration, 2-3 colors.
Design: two figures (one larger, one smaller) or a guiding hand/star, 
representing mentorship and knowledge transfer. Amber (#F59E0B) primary color.
Flat shapes, bold outlines, no gradients.
Square format, centered, readable at 32px.
--ar 1:1 --style raw --v 6
```

---

### BADGE 6 — Lenda (nível máximo de XP)

**Cor principal:** Rosa/vermelho intenso `oklch(0.65 0.22 10)` ≈ `#F43F5E`  
**Significado:** Atingiu o nível máximo "Lenda" (10.000+ XP)

```
Flat design badge icon for "Legend" — the highest level achievement 
in a tech developer community. Style: bold flat illustration, 2-3 colors.
Design: a flame or rising phoenix silhouette, or a crown with a star. 
Should feel legendary, epic but still flat/geometric. 
Deep rose-red (#F43F5E) as primary color, dark outline.
No gradients, maximum contrast, memorable shape.
Square format, centered.
--ar 1:1 --style raw --v 6
```

---

## IMAGEM 13 — Avatar Placeholder (programático)

**Onde aparece:** Qualquer perfil sem foto de avatar  
**Tamanho:** SVG gerado dinamicamente ou PNG 128×128px  
**Nota:** Idealmente gerado em código (não precisa de IA)

### Implementação sugerida (código)
O avatar placeholder deve usar as iniciais do usuário com cor de fundo derivada do hash do `@username`:

```typescript
// Paleta de fundos para avatares (todas com contraste suficiente para texto branco)
const AVATAR_COLORS = [
  '#1D4ED8', // azul primary
  '#059669', // verde
  '#D97706', // âmbar
  '#7C3AED', // violeta
  '#DC2626', // vermelho
  '#0891B2', // ciano
  '#65A30D', // lime
  '#9333EA', // púrpura
];

function getAvatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(username: string): string {
  // Remove o "@" se houver, pega as duas primeiras letras
  const clean = username.replace('@', '').toUpperCase();
  return clean.slice(0, 2);
}
```

---

## Onde salvar as imagens no projeto

```
public/
├── images/
│   ├── event-main.webp          ← Foto de evento principal
│   ├── event-secondary.webp     ← Foto de evento secundária
│   └── tocantins-landscape.webp ← Paisagem do Tocantins
├── badges/
│   ├── badge-top1-mes.png
│   ├── badge-top3-mes.png
│   ├── badge-primeira-contribuicao.png
│   ├── badge-colaborador-ativo.png
│   ├── badge-mentor.png
│   └── badge-lenda.png
└── logo/
    ├── logo.svg                 ← Logo horizontal completo
    ├── logo-symbol.svg          ← Símbolo apenas
    └── logo-white.svg           ← Versão branca
```

---

## Checklist de implementação após ter as imagens

- [ ] `public/logo/logo.svg` → substituir o placeholder "DT" no AppBar
- [ ] `public/logo/logo-white.svg` → usar na coluna esquerda do login/cadastro
- [ ] `public/images/event-main.webp` → importar com `next/image` na landing page (seção "Perfis em Destaque") e na coluna da tela de login
- [ ] `public/images/tocantins-landscape.webp` → usar como faixa de capa padrão nos perfis públicos (com overlay)
- [ ] Badges → cadastrar as URLs no banco de dados (ou hardcoded em `src/lib/badges.ts` inicialmente)
- [ ] `public/logo/logo-symbol.svg` → substituir o ícone `Zap` que está no `<head>` como favicon
