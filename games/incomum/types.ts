/** Uma categoria do dia como o jogador vê: o tema, sem as respostas. */
export interface IncomumCategory {
  title: string;
  /** Quantas respostas a categoria aceita. */
  total: number;
}

/**
 * Uma categoria no índice que vai com o jogo (games/incomum/data/index.json). As respostas ficam em
 * public/incomum/<id>.json e só são baixadas no dia em que a categoria cai.
 */
export interface IncomumCategoryRef {
  id: string;
  title: string;
  total: number;
  /** A resposta mais óbvia. */
  obvious: string;
  /** As raríssimas mais conhecidas, para mostrar no fim o que dava para ter dito. */
  rare: string[];
  /** Versão do arquivo das respostas (muda quando ele muda). */
  v: string;
  /**
   * Primeiro dia em que a categoria entra no sorteio. Sem isso, categoria nova mudaria o sorteio dos
   * dias que já passaram (e o de hoje, no meio das partidas).
   */
  since?: string;
}

export interface IncomumPuzzle {
  categories: IncomumCategory[];
}

export interface IncomumFeedback {
  /** A resposta como está na lista ("Foz do Iguaçu" mesmo digitando "foz"); null quando pulou. */
  answer: string | null;
  /** Faixa de raridade (índice em TIERS); -1 quando pulou. */
  tier: number;
  points: number;
  /** Posição da resposta, da mais óbvia (1) à mais rara (`total`). */
  rank: number;
  /** A resposta mais óbvia da categoria, para comparar no resultado. */
  obvious: string;
  /** Sem resposta: pulou ou o tempo acabou. */
  missed?: "skip" | "time";
  /** Quantas respostas a categoria aceita (para a régua de raridade). */
  total: number;
}
