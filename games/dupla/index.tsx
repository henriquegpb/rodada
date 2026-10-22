import { Columns2 } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { MultiWordBoard } from "../_shared/multiword/Board";
import { MultiWordCover } from "../_shared/multiword/Cover";
import { MultiWordRecap, multiWordShareGrid } from "../_shared/multiword/Recap";
import type { MultiWordFeedback, MultiWordPuzzle } from "../_shared/multiword/types";

export const dupla: GameDefinition<MultiWordPuzzle, MultiWordFeedback, AttemptRules> = {
  meta: {
    slug: "dupla",
    name: "Dupla",
    tagline: "Duas palavras de uma vez",
    description: "Descubra duas palavras de 5 letras ao mesmo tempo em até 7 tentativas.",
    icon: Columns2,
    parent: "palavra",
    rules: { type: "attempts", maxAttempts: 7 },
    // Modo do Palavra: mesma cor dele.
    color: "#ff6a1a",
    howToPlay: [
      "Duas palavras de 5 letras ao mesmo tempo, em até 7 tentativas.",
      "Cada tentativa vale para os dois tabuleiros, com as mesmas cores do Palavra.",
      "Quando você acerta uma palavra, aquele tabuleiro para; continue na outra.",
      "No teclado, cada tecla se divide em duas: a cor da esquerda é do 1º tabuleiro, a da direita do 2º.",
    ],
  },
  Board: (props) => (
    <MultiWordBoard
      {...props}
      gridClass="grid-cols-2"
      tileSize="size-[min(8.2vw,52px)] text-[min(4.6vw,24px)]"
    />
  ),
  Cover: (props) => <MultiWordCover boards={2} {...props} />,
  Recap: MultiWordRecap,
  shareGrid: multiWordShareGrid,
};
