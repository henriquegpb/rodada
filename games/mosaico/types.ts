export const COLS = 3;
export const ROWS = 2;

export interface MosaicoPuzzle {
  image: string;
  /** Ordem em que as peças (0 a COLS×ROWS−1, da esquerda para a direita, de cima para baixo) são reveladas. */
  order: number[];
}
