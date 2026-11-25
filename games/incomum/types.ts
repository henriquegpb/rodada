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
  /**
   * Primeiro dia desta versão das respostas. Antes dele vale a versão anterior (`previous`): a lista
   * crescer não muda a partida de um dia que já foi jogado, nem a de hoje no meio do dia.
   */
  from?: string;
  /** As versões anteriores, da mais antiga à mais nova, cada uma guardada em public/incomum/v/. */
  previous?: IncomumCategoryVersion[];
  /** Esta é uma versão anterior: as respostas estão em public/incomum/v/<id>.<v>.json. */
  archived?: boolean;
}

/** Uma versão anterior das respostas de uma categoria, e o dia em que ela começou a valer. */
export interface IncomumCategoryVersion {
  title: string;
  total: number;
  obvious: string;
  rare: string[];
  v: string;
  from?: string;
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
