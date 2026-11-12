/**
 * Qual lado do contorno é o tamanho perguntado: a altura (y), ou o comprimento e a envergadura
 * (asas ou pernas abertas), que são a largura (x).
 */
export type Measure = "altura" | "comprimento" | "envergadura" | "diâmetro" | "norte a sul";

/** O desenho de uma coisa, sem o tamanho: imagem recortada rente ou path SVG com a sua caixa. */
export type Shape =
  | { kind: "image"; src: string; aspect: number }
  | { kind: "path"; d: string; box: [x: number, y: number, w: number, h: number] };

export interface EscalaItemView {
  name: string;
  measure: Measure;
  shape: Shape;
}

export interface EscalaRound {
  /** A referência vai no tamanho de verdade, com o número. */
  reference: EscalaItemView & { size: number };
  /** O alvo vai sem o tamanho: é a resposta. */
  target: EscalaItemView;
}

export interface EscalaPuzzle {
  rounds: EscalaRound[];
}

export interface EscalaFeedback {
  /** Palpite e tamanho real, em metros, do lado perguntado. */
  guess: number;
  actual: number;
  /** 0 a 100. */
  points: number;
}
