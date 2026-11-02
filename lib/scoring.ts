import type { GameRules, GuessCurve, PlayStatus } from "@/games/types";

/** Sem limite, quando o jogo não define a sua curva: 100 de primeira, 10 a menos por chute, até 10. */
export const UNLIMITED_CURVE: GuessCurve = [
  [1, 100],
  [10, 10],
];

/** A Nota da curva com `count` chutes, arredondada. */
function onCurve(curve: GuessCurve, count: number): number {
  const next = curve.findIndex(([guesses]) => count <= guesses);
  if (next === -1) return curve[curve.length - 1][1];
  if (next === 0) return curve[0][1];
  const [x0, y0] = curve[next - 1];
  const [x1, y1] = curve[next];
  return Math.round(y0 + ((y1 - y0) * (count - x0)) / (x1 - x0));
}

/**
 * Score bruto de uma partida, na escala do próprio jogo; os Rankings usam a Nota (`gradePlay`).
 * Tentativas: quanto menos, mais pontos; derrota vale zero (6 tentativas → 6 a 1).
 * Sem limite: a Nota da curva do jogo (`curve`, ou `UNLIMITED_CURVE`); desistir vale zero.
 * Tempo: um ponto por item achado. Quiz: um ponto por acerto. Pontos: os do próprio jogo.
 * Vidas: uma por vida que sobrou (3 vidas sem errar → 3); perder vale zero.
 */
export function scorePlay(rules: GameRules, status: PlayStatus, count: number): number {
  if (rules.type === "timed" || rules.type === "quiz" || rules.type === "points") return count;
  if (status !== "won") return 0;
  if (rules.type === "unlimited") return onCurve(rules.curve ?? UNLIMITED_CURVE, count);
  if (rules.type === "lives") return rules.lives - count;
  return rules.maxAttempts + 1 - count;
}

/**
 * O maior Score bruto possível num desafio. No jogo por pontos ele muda a cada dia e vem da engine
 * (`maxPoints`); nos outros sai das regras.
 */
export function maxScore(rules: GameRules, pointsMax?: number): number {
  switch (rules.type) {
    case "attempts":
      return rules.maxAttempts;
    case "unlimited":
      return 100;
    case "timed":
    case "quiz":
      return rules.total;
    case "lives":
      return rules.lives;
    case "points":
      if (!pointsMax) throw new Error("jogo por pontos sem o máximo do desafio");
      return pointsMax;
  }
}

/**
 * A Nota da partida: o Score bruto em 0–100 do máximo possível naquele desafio, para que um
 * Jogo perfeito valha o mesmo em qualquer jogo. Palavras fora da lista oficial da Colmeia podem
 * passar do máximo; a Nota para em 100.
 */
export function gradePlay(rules: GameRules, status: PlayStatus, count: number, pointsMax?: number): number {
  const max = maxScore(rules, pointsMax);
  return Math.round((100 * Math.min(scorePlay(rules, status, count), max)) / max);
}
