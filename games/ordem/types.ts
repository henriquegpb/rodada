/** O que se compara no dia: muda todo dia. */
export type OrdemCategory = "area" | "population" | "gdp" | "gdpPerCapita" | "density" | "lifeExpectancy";

/** Um país do desafio, como o jogador vê: sem o número. */
export interface OrdemItem {
  code: string;
  name: string;
}

/** A categoria do dia e os países, numa ordem embaralhada que não diz nada sobre a resposta. */
export interface OrdemPuzzle {
  category: OrdemCategory;
  items: OrdemItem[];
}

/** A ordem certa (do maior para o menor na categoria) e o número de cada país. */
export interface OrdemAnswer {
  category: OrdemCategory;
  order: string[];
  values: Record<string, number>;
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
  /** O número de cada país que ficou na posição certa; null nos outros. */
  values: (number | null)[];
}
