/** O Calor não mostra nada antes do primeiro chute: o desafio é só o país secreto. */
export type CalorPuzzle = Record<string, never>;

export interface CalorFeedback {
  code: string;
  name: string;
  /** Menor distância entre as fronteiras do chute e do país secreto; vizinhos = 0. */
  km: number;
}
