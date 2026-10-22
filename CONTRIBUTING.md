# Contribuindo com o Rodada

Obrigado por querer ajudar! Antes de abrir um PR, rode:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

## Adicionando um jogo

Um jogo é uma pasta em `games/<slug>/` com duas metades:

| Arquivo     | O que faz                                              | Pode conhecer a resposta? |
| ----------- | ------------------------------------------------------ | ------------------------- |
| `engine.ts` | Gera o desafio do dia e valida as tentativas           | **Sim**                   |
| `index.ts`  | Metadados, tabuleiro (UI) e grade do compartilhamento  | **Não**                   |

A separação é o que vai impedir trapaça quando o backend existir: a `engine` passa a rodar só no servidor. Por isso, **`index.ts` e o tabuleiro nunca importam `engine.ts` nem os dados de resposta.**

O passo a passo usa um jogo hipotético `capital` (adivinhar a capital de um país) como exemplo.

### 1. Tipos

`games/capital/types.ts` define o que o jogador vê (`Puzzle`) e o feedback de cada tentativa (`Feedback`):

```ts
export interface CapitalPuzzle {
  country: string; // "Austrália"
}

export interface CapitalFeedback {
  city: string;
  correct: boolean;
}
```

### 2. Engine

`games/capital/engine.ts` implementa `GameEngine<Puzzle, Answer, Feedback>` (veja `games/types.ts`):

```ts
import { pickDaily } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import type { GameEngine } from "../types";
import capitals from "./data/capitals.json"; // [{ country, capital }]
import type { CapitalFeedback, CapitalPuzzle } from "./types";

export const engine: GameEngine<CapitalPuzzle, string, CapitalFeedback> = {
  createChallenge(dateKey) {
    const item = pickDaily(capitals, { slug: "capital", dateKey });
    return { puzzle: { country: item.country }, answer: item.capital };
  },

  checkGuess(input, answer, previous) {
    if (!input.trim()) return { ok: false, error: "Digite uma cidade" };
    if (previous.some((g) => normalize(g.input) === normalize(input))) {
      return { ok: false, error: "Você já tentou essa" };
    }
    const correct = normalize(input) === normalize(answer);
    return { ok: true, solved: correct, feedback: { city: input, correct } };
  },

  describeAnswer: (answer) => answer,
};
```

Regras:

- **Use sempre `pickDaily`** para escolher o desafio. Ele garante o mesmo desafio para todo mundo, sem repetição, e embaralhado pelo segredo do servidor. Nunca use `Math.random()` nem `Date.now()` aqui.
- **O `puzzle` não pode conter a resposta**, nem algo que a revele (um nome de arquivo, um código).
- Uma tentativa inválida (palavra que não existe, repetida…) devolve `{ ok: false, error }` e não gasta tentativa. A mensagem aparece para o jogador.

### 3. Tabuleiro

`games/capital/Board.tsx` é um Client Component que recebe `BoardProps`:

```tsx
"use client";

import type { BoardProps } from "../types";
import type { CapitalFeedback, CapitalPuzzle } from "./types";

export function CapitalBoard({ play, rules, submitGuess }: BoardProps<CapitalPuzzle, CapitalFeedback, AttemptRules>) {
  // play.puzzle, play.guesses, play.status ("playing" | "won" | "lost")
  // submitGuess(texto) → Promise<string | null>  (mensagem de erro ou null)
}
```

O tabuleiro não cuida de cabeçalho, resultado, compartilhamento, estatísticas nem "como jogar". Isso tudo é da plataforma (`components/game/game-screen.tsx`).

Para um jogo de "adivinhe o país", reaproveite `games/_shared/geo`. Os jogos `bandeira/` e `pais/` são só uma engine com `createCountryEngine` e um `CountryBoard` com um `visual` diferente.

### 4. Definição do jogo

`games/capital/index.ts`:

```ts
import { Landmark } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { CapitalBoard } from "./Board";
import { CapitalCover } from "./Cover";
import { CapitalRecap } from "./Recap";
import type { CapitalFeedback, CapitalPuzzle } from "./types";

export const capital: GameDefinition<CapitalPuzzle, CapitalFeedback, AttemptRules> = {
  meta: {
    slug: "capital",          // vira a URL /capital
    name: "Capital",
    tagline: "Qual é a capital?",
    description: "Descubra a capital do país em até 6 tentativas.",
    icon: Landmark,           // qualquer ícone do lucide-react
    rules: { type: "attempts", maxAttempts: 6 },
    color: "#a855f7",         // cor do card e dos destaques
    howToPlay: ["Uma frase por item."],
    // Para o Google e as prévias de link; não aparece na tela.
    seo: {
      title: "Capital do dia: adivinhe a capital do país",
      description: "Jogo diário de geografia em português: descubra a capital do país em até 6 tentativas.",
    },
  },
  Board: CapitalBoard,
  Cover: CapitalCover,
  // Resumo visual no modal de resultado (o texto com emojis é só para o WhatsApp).
  Recap: CapitalRecap,
  // Só a grade; o cabeçalho "Rodada · Capital #12 · 3/6" e o link são da plataforma.
  shareGrid: (play) => play.guesses.map((g) => (g.feedback.correct ? "🟧" : "⬛")).join(""),
};
```

**Regras.** `rules` diz como a partida termina e como o resultado é contado:

- `{ type: "attempts", maxAttempts }`: acertar em até N tentativas. A partida acaba em `won` ou `lost`, e a plataforma mostra "3/6" ou "X/6".
- `{ type: "unlimited" }`: chutes sem limite até acertar. O tabuleiro pode chamar `finish()` para desistir, e a partida acaba em `lost`. A plataforma mostra "8 chutes" ou "X". O jogo `calor/` é o modelo.
- `{ type: "timed", seconds, total }`: achar o máximo de itens antes do relógio zerar. O tabuleiro recebe `begin()` (começa o relógio) e `finish()` (tempo esgotado ou desistência). Cada tentativa aceita é um item achado, e `solved: true` encerra com vitória quando acha todos. A plataforma mostra "142/197". O jogo `mundo/` é o modelo.

Placar, estatísticas, sequências e compartilhamento se adaptam sozinhos às regras.

**SEO.** `seo.title` é o título da aba e do Google (ganha " · Rodada" no fim) e deve usar as palavras que as pessoas buscam, como "do dia" e o tipo de jogo; `seo.description` é o resumo que aparece no resultado da busca. A página do jogo já sai com as regras (`howToPlay`) em texto no fim, com a imagem de prévia na cor do jogo e no sitemap, sem configurar nada.

**Modos.** Um jogo pode ser modo de outro com `parent: "<slug do pai>"` no meta (Dupla e Quadra são modos do Palavra). Ele tem desafio, partida e estatísticas próprios, mas não entra na rodada: aparece como aba na página do jogo pai, que mantém o título e o lugar na sidebar.

A **capa** (`Cover.tsx`) é a ilustração do card na home e no cabeçalho do "como jogar". É um SVG próprio, `viewBox="0 0 240 200"`, desenhado com `currentColor` (a tinta escura) e branco sobre a cor do jogo. Veja as capas de `palavra/`, `bandeira/` e `pais/`. Não use ícone pronto como capa.

### 5. Registre nos dois índices

```ts
// games/index.ts
import { capital } from "./capital";
export const games = [palavra, bandeira, pais, capital] as GameDefinition[];

// games/engines.ts
capital: () => import("./capital/engine"),
```

Pronto. O jogo aparece na home, na barra lateral, no perfil e em `/capital`. O teste `games/registry.test.ts` falha se você esquecer um dos dois registros.

### 6. Testes

Crie `games/capital/engine.test.ts` cobrindo pelo menos:

- o desafio é determinístico para a mesma data;
- o `puzzle` não contém a resposta;
- a validação aceita o acerto, recusa entradas inválidas e não aceita tentativa repetida.

Os testes de `palavra/` e `_shared/geo/` servem de modelo.

### Dados

Se o jogo precisa de dados gerados (listas, geometrias), adicione a geração em `scripts/build-data.ts` e documente a fonte e a licença na tabela do README. **Só use dados e imagens com licença aberta.** Não use nomes, marcas ou identidade visual de jogos existentes.

## Outras contribuições

- **Palavras:** as respostas do Palavra ficam em `games/palavra/data/answers.json`. São substantivos e adjetivos comuns, poucos verbos no infinitivo, e nada de nomes próprios, plurais ou palavrões. Depois de editar, rode `pnpm data:build` para regenerar as palavras válidas e `pnpm test` para checar duplicatas.
- **Grupos do Elo:** os desafios ficam em `games/elo/data/puzzles.json`, cada um com 4 grupos de 4 palavras do nível 0 (óbvio) ao 3 (trocadilho). Em maiúsculas, com acento e até 10 letras, para caber na grade do celular. As iscas são bem-vindas, mas confira que só existe um jeito de dividir as 16 palavras. Desafios com `source` vêm de grupos traduzidos do Only Connect Wall; os sem `source` são curadoria própria. Rode `pnpm test` para checar o formato. Como a ordem dos desafios depende do tamanho da lista, adicionar desafios embaralha todos os dias, inclusive o de hoje (a partida em andamento recomeça); prefira adicionar em lote.
- **Nomes de países:** para corrigir um nome ou adicionar um apelido aceito, edite `scripts/country-list.ts` e rode `pnpm data:build`.
- **Textos:** os textos da plataforma ficam em `lib/i18n/pt-BR.ts`. Não deixe texto solto em componente.
