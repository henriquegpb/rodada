/** 0 = o grupo mais fácil, 3 = o mais difícil (geralmente um trocadilho). */
export type EloLevel = 0 | 1 | 2 | 3;

export interface EloGroup {
  label: string;
  level: EloLevel;
  words: string[];
}

export interface EloPuzzle {
  /** As 16 palavras embaralhadas; nada indica de que grupo cada uma é. */
  words: string[];
}

export interface EloFeedback {
  /** As 4 palavras do chute, na grafia do jogo. */
  words: string[];
  /** O grupo, se o chute acertou; null quando errou. */
  group: EloGroup | null;
  /** Errou por uma: 3 das 4 palavras são do mesmo grupo. */
  oneAway: boolean;
}
