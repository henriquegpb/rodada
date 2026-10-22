import type { Direction } from "./index";

export interface CountryFeedback {
  code: string;
  name: string;
  distanceKm: number;
  /** Para onde fica a resposta a partir do chute; null quando acertou. */
  direction: Direction | null;
  /** 0–100 */
  proximity: number;
}
