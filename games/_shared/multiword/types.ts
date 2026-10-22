import type { LetterMark } from "../../palavra/types";

export interface MultiWordPuzzle {
  length: number;
  boards: number;
}

export interface MultiWordFeedback {
  /** Letras da tentativa com acento, uma por posição. */
  letters: string[];
  /** Cores em cada tabuleiro; null nos que já estavam resolvidos antes desta tentativa. */
  boards: (LetterMark[] | null)[];
}
