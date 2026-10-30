export interface ColmeiaPuzzle {
  /** As 6 letras de fora, sem acento, na ordem da colmeia. */
  outer: string[];
  /** A letra do meio: toda palavra precisa dela. */
  center: string;
  /** Totais do dia, sem as palavras: quantas há e quantos pontos valem. */
  totalWords: number;
  maxPoints: number;
  pangrams: number;
  /** Para as dicas: palavras por letra inicial e tamanho ("d" → {4: 5, 6: 7}). */
  grid: Record<string, Record<number, number>>;
  /** Para as dicas: palavras por duas primeiras letras ("di" → 10). */
  pairs: Record<string, number>;
}

export interface ColmeiaFeedback {
  /** A palavra como está na lista, com acento ("cidadã" mesmo digitando "cidada"). */
  word: string;
  points: number;
  pangram: boolean;
  /** Palavra válida fora da lista oficial ("ciano"): vale pontos, mas não conta no total nem nas dicas. */
  extra?: true;
}
