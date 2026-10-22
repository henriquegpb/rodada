import { Type } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { PalavraBoard } from "./Board";
import { PalavraCover } from "./Cover";
import type { LetterMark, PalavraFeedback, PalavraPuzzle } from "./types";

const EMOJI: Record<LetterMark, string> = { correct: "🟧", present: "🟦", absent: "⬛" };

export const palavra: GameDefinition<PalavraPuzzle, PalavraFeedback, AttemptRules> = {
  meta: {
    slug: "palavra",
    name: "Palavra",
    tagline: "5 letras, 6 chances",
    description: "Adivinhe a palavra de 5 letras em até 6 tentativas.",
    icon: Type,
    rules: { type: "attempts", maxAttempts: 6 },
    color: "#ff6a1a",
    howToPlay: [
      "Descubra a palavra de 5 letras em até 6 tentativas.",
      "Depois de cada tentativa, as letras mudam de cor:",
      "🟧 laranja: a letra está na palavra e no lugar certo.",
      "🟦 azul: a letra está na palavra, mas em outro lugar.",
      "⬛ cinza: a letra não está na palavra.",
      "Acentos e cedilha são preenchidos sozinhos. Clique numa casa para editar uma letra.",
    ],
  },
  Board: PalavraBoard,
  Cover: PalavraCover,
  shareGrid: (play) => play.guesses.map((g) => g.feedback.marks.map((m) => EMOJI[m]).join("")).join("\n"),
};
