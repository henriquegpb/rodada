export interface RainhasPuzzle {
  size: number;
  /** A cor de cada casa, linha a linha: "aabbc…" (a primeira cor é "a"). */
  regions: string;
}

export interface RainhasFeedback {
  /** Casa da rainha (`linha * size + coluna`). */
  cell: number;
  /** A rainha estava no lugar certo. Errada, custa uma vida e a casa fica marcada. */
  correct: boolean;
  /** Veio de uma dica: a rainha foi revelada, não colocada. */
  hint?: true;
}
