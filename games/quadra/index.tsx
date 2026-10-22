import { Grid2x2 } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { MultiWordBoard } from "../_shared/multiword/Board";
import { MultiWordCover } from "../_shared/multiword/Cover";
import { MultiWordRecap, multiWordShareGrid } from "../_shared/multiword/Recap";
import type { MultiWordFeedback, MultiWordPuzzle } from "../_shared/multiword/types";

export const quadra: GameDefinition<MultiWordPuzzle, MultiWordFeedback, AttemptRules> = {
  meta: {
    slug: "quadra",
    name: "Quadra",
    tagline: "Quatro palavras de uma vez",
    description: "Descubra quatro palavras de 5 letras ao mesmo tempo em até 9 tentativas.",
    icon: Grid2x2,
    parent: "palavra",
    rules: { type: "attempts", maxAttempts: 9 },
    // Modo do Palavra: mesma cor dele.
    color: "#ff6a1a",
    // Quatro tabuleiros numa linha só no desktop.
    wide: true,
    howToPlay: [
      "Quatro palavras de 5 letras ao mesmo tempo, em até 9 tentativas.",
      "Cada tentativa vale para todos os tabuleiros ainda abertos, com as mesmas cores do Palavra.",
      "Quando você acerta uma palavra, aquele tabuleiro para; continue nas outras.",
      "No teclado, cada tecla se divide em quatro partes, uma por tabuleiro, na mesma posição deles na tela.",
    ],
  },
  Board: (props) => (
    <MultiWordBoard
      {...props}
      gridClass="grid-cols-2 lg:grid-cols-4"
      tileSize="size-[min(8.2vw,40px)] text-[min(4.6vw,19px)]"
    />
  ),
  Cover: (props) => <MultiWordCover boards={4} {...props} />,
  Recap: MultiWordRecap,
  shareGrid: multiWordShareGrid,
};
