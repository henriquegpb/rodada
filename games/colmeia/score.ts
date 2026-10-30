import type { PlayView } from "../types";
import type { ColmeiaFeedback } from "./types";

export const MIN_LENGTH = 4;
export const LETTERS = 7;
/** Bônus de quem usa as 7 letras numa palavra só. */
const PANGRAM_BONUS = 7;

/** Usa as 7 letras da colmeia (`key` já sem acento). */
export const isPangram = (key: string) => new Set(key).size === LETTERS;

/** 4 letras vale 1 ponto; daí em diante, 1 por letra; pangrama ganha mais 7. */
export function wordPoints(key: string): number {
  return (key.length === MIN_LENGTH ? 1 : key.length) + (isPangram(key) ? PANGRAM_BONUS : 0);
}

/** Níveis, pela fração dos pontos possíveis do dia. Gênio não exige achar tudo. */
export const RANKS: { name: string; share: number }[] = [
  { name: "Iniciante", share: 0 },
  { name: "Bom começo", share: 0.02 },
  { name: "Avançando", share: 0.05 },
  { name: "Bom", share: 0.08 },
  { name: "Sólido", share: 0.15 },
  { name: "Muito bom", share: 0.25 },
  { name: "Ótimo", share: 0.4 },
  { name: "Incrível", share: 0.5 },
  { name: "Gênio", share: 0.7 },
];

/** Pontos mínimos de cada nível numa colmeia com `max` pontos possíveis. */
export const rankThresholds = (max: number) => RANKS.map((r) => Math.round(r.share * max));

/** Índice do nível atual em RANKS. */
export function rankIndex(points: number, max: number): number {
  const thresholds = rankThresholds(max);
  let i = 0;
  while (i + 1 < thresholds.length && points >= thresholds[i + 1]) i++;
  return i;
}

export const pointsOf = (play: PlayView<unknown, ColmeiaFeedback>) =>
  play.guesses.reduce((sum, g) => sum + g.feedback.points, 0);
