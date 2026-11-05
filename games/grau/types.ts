/** 1 = ler o ângulo desenhado; 2 = desenhar o ângulo pedido. */
export type GrauRound = 1 | 2;

/**
 * Direções em graus, no sentido anti-horário a partir das 3 horas. O ângulo vai sempre do braço
 * `from` girando no sentido anti-horário até o outro braço.
 */
export interface GrauPuzzle {
  /**
   * Ângulo 1, para ler. Os dois braços precisam ir desenhados, então quem fizer a conta no DevTools
   * acha a resposta: é o mesmo limite do resto do Rodada enquanto o desafio roda no navegador.
   */
  read: { from: number; to: number };
  /** Ângulo 2, para desenhar: o valor pedido e a direção do braço fixo. */
  draw: { target: number; from: number };
}

export interface GrauAnswer {
  read: number;
  draw: number;
}

export interface GrauFeedback {
  round: GrauRound;
  /** O ângulo chutado (1) ou desenhado (2), em graus inteiros. */
  value: number;
  /** 0 = acertou; de 1 (Fervendo) a 5 (Gelado), veja `HEAT`. */
  heat: number;
  /** Para onde fica a resposta: 1 = ângulo maior, -1 = menor, 0 = acertou. */
  dir: -1 | 0 | 1;
  /** O valor certo, revelado quando o ângulo é resolvido. */
  exact?: number;
}
