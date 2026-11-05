import { pickDaily } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { currentRound, heatOf } from "./heat";
import type { GrauAnswer, GrauFeedback, GrauPuzzle } from "./types";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Ângulos do desafio: de 10° a 350°, fora os que ficam a menos de 5° de um reto, um raso ou 270°,
 * que dá para acertar sem olhar direito.
 */
export const ANGLES = range(10, 350).filter((a) => Math.abs(a - Math.round(a / 90) * 90) >= 5);

/** Para onde aponta o braço fixo: o desenho gira todo dia, para nenhum braço ficar sempre deitado. */
const TURNS = range(0, 359);

/** "137", "137°" ou "137 graus" → 137. */
function parseDegrees(input: string): number | null {
  const text = input.trim().replace(/\s*(°|graus?)$/i, "");
  return /^\d{1,3}$/.test(text) ? Number(text) : null;
}

export const engine: GameEngine<GrauPuzzle, GrauAnswer, GrauFeedback> = {
  createChallenge(dateKey) {
    const read = pickDaily(ANGLES, { slug: "grau:ler", dateKey });
    const draw = pickDaily(ANGLES, { slug: "grau:desenhar", dateKey });
    const readFrom = pickDaily(TURNS, { slug: "grau:giro-ler", dateKey });
    const drawFrom = pickDaily(TURNS, { slug: "grau:giro-desenhar", dateKey });
    return {
      puzzle: { read: { from: readFrom, to: (readFrom + read) % 360 }, draw: { target: draw, from: drawFrom } },
      answer: { read, draw },
    };
  },

  checkGuess(input, answer, previous) {
    const round = currentRound(previous);
    const value = parseDegrees(input);
    if (value === null || value < 1 || value > 359) {
      return { ok: false, error: round === 1 ? "Digite um número de 1 a 359" : "Abra o ângulo antes de confirmar" };
    }
    if (previous.some((g) => g.feedback.round === round && g.feedback.value === value)) {
      return { ok: false, error: round === 1 ? "Você já chutou esse" : "Você já desenhou esse ângulo" };
    }
    const target = round === 1 ? answer.read : answer.draw;
    const heat = heatOf(Math.abs(target - value));
    const solved = heat === 0;
    const feedback: GrauFeedback = { round, value, heat, dir: solved ? 0 : target > value ? 1 : -1 };
    if (solved) feedback.exact = target;
    return { ok: true, feedback, solved: solved && round === 2 };
  },

  describeAnswer: (answer) => `${answer.read}° e ${answer.draw}°`,
};
