export type LetterMark = "correct" | "present" | "absent";

export interface PalavraPuzzle {
  length: number;
}

export interface PalavraFeedback {
  /** Letras da tentativa com acento, uma por posição. */
  letters: string[];
  marks: LetterMark[];
}
