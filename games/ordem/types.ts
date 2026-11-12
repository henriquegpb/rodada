/** Um país do desafio, como o jogador vê: sem a área. */
export interface OrdemItem {
  code: string;
  name: string;
}

/** Os países do dia, numa ordem embaralhada que não diz nada sobre a resposta. */
export interface OrdemPuzzle {
  items: OrdemItem[];
}

/** A ordem certa (do maior para o menor) e a área de cada país, em km². */
export interface OrdemAnswer {
  order: string[];
  areas: Record<string, number>;
}

/**
 * Como ficou cada posição do chute. Só certo ou errado, sem dizer para onde o país vai: com setas,
 * quem não sabe nada de geografia resolvia sempre em até 3 tentativas, só por lógica.
 */
export type OrdemMark = "correct" | "wrong";

export interface OrdemFeedback {
  /** Os códigos na ordem chutada, de cima (maior) para baixo (menor). */
  order: string[];
  marks: OrdemMark[];
  /** A área de cada país que ficou na posição certa (km²); null nos outros. */
  areas: (number | null)[];
}
