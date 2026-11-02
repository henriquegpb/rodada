import type { GameRules, PlayStatus } from "@/games/types";

/** Sem limite: acertar no mínimo de chutes vale isto, e cada chute a mais vale um a menos. */
const UNLIMITED_MAX = 10;

/**
 * Score bruto de uma partida, na escala do próprio jogo; os Rankings usam a Nota (`gradePlay`).
 * Tentativas: quanto menos, mais pontos; derrota vale zero (6 tentativas → 6 a 1).
 * Sem limite: 10 pontos acertando no mínimo de chutes (`minGuesses`, de primeira se não houver), um
 * a menos por chute a mais, mínimo 1; desistir vale zero.
 * Tempo: um ponto por item achado. Quiz: um ponto por acerto. Pontos: os do próprio jogo.
 * Vidas: uma por vida que sobrou (3 vidas sem errar → 3); perder vale zero.
 */
export function scorePlay(rules: GameRules, status: PlayStatus, count: number): number {
  if (rules.type === "timed" || rules.type === "quiz" || rules.type === "points") return count;
  if (status !== "won") return 0;
  if (rules.type === "unlimited") return Math.max(1, UNLIMITED_MAX + (rules.minGuesses ?? 1) - count);
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
      return UNLIMITED_MAX;
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
