import type { LivesRules, PlayView } from "../types";
import type { RainhasFeedback } from "./types";

/** Cor das Rainhas e dos seus tamanhos (9×9 e 10×10 são modos do mesmo jogo). */
export const COLOR = "#c9cdd4";

export const RULES: LivesRules = { type: "lives", lives: 3 };

/** Tentativa que pede uma dica em vez de colocar uma rainha. */
export const HINT = "?";
export const HINTS = 3;

/** Cores das regiões, na ordem das letras do tabuleiro: claras o bastante para a rainha escura. */
export const REGION_COLORS = [
  "#5ba7a8",
  "#e5a97b",
  "#bf74b0",
  "#a28ad6",
  "#76b2d8",
  "#d6bd5a",
  "#b48a6f",
  "#7a8cc9",
  "#7ab37a",
  "#e094b0",
];

export const mistakesOf = (play: PlayView<unknown, RainhasFeedback>) => play.guesses.filter((g) => !g.feedback.correct).length;
export const hintsOf = (play: PlayView<unknown, RainhasFeedback>) => play.guesses.filter((g) => g.feedback.hint).length;

/** Vidas que sobraram, em corações, e as dicas usadas. */
export function shareGrid(play: PlayView<unknown, RainhasFeedback>): string {
  const left = RULES.lives - mistakesOf(play);
  const hints = hintsOf(play);
  const hearts = "❤️".repeat(Math.max(0, left)) + "🖤".repeat(RULES.lives - Math.max(0, left));
  return hints ? `${hearts}\n💡 ${hints} ${hints === 1 ? "dica" : "dicas"}` : hearts;
}
