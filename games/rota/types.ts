/** route: está num caminho mais curto · near: desvia 1–2 fronteiras · far: desvia mais ou nem chega por terra. */
export type RotaVerdict = "route" | "near" | "far";

export interface RotaPuzzle {
  start: string;
  end: string;
  /**
   * Países no meio de um caminho mais curto, usados pelas dicas.
   * Sem backend, chega ao navegador; com backend, cada dica vira um pedido ao servidor.
   */
  route: string[];
}

export interface RotaAnswer {
  start: string;
  end: string;
}

export interface RotaFeedback {
  code: string;
  name: string;
  verdict: RotaVerdict;
}
