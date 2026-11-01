import { describe, expect, it } from "vitest";
import type { GameRules } from "@/games/types";
import { gradePlay, maxScore } from "./scoring";

const attempts: GameRules = { type: "attempts", maxAttempts: 6 };
const unlimited: GameRules = { type: "unlimited" };
const timed: GameRules = { type: "timed", seconds: 900, total: 197 };
const quiz: GameRules = { type: "quiz", total: 10 };
const points: GameRules = { type: "points" };
const lives: GameRules = { type: "lives", lives: 3 };

describe("Nota", () => {
  it("vale 100 num Jogo perfeito de qualquer tipo", () => {
    expect(gradePlay(attempts, "won", 1)).toBe(100);
    expect(gradePlay(unlimited, "won", 1)).toBe(100);
    expect(gradePlay(timed, "won", 197)).toBe(100);
    expect(gradePlay(quiz, "won", 10)).toBe(100);
    expect(gradePlay(points, "won", 240, 240)).toBe(100);
    expect(gradePlay(lives, "won", 0)).toBe(100);
  });

  it("é proporcional ao máximo do desafio", () => {
    expect(gradePlay(attempts, "won", 3)).toBe(67); // 4 de 6
    expect(gradePlay(attempts, "won", 6)).toBe(17); // 1 de 6
    expect(gradePlay(unlimited, "won", 8)).toBe(30);
    expect(gradePlay(unlimited, "won", 40)).toBe(10); // nunca menos que 1 de 10 acertando
    expect(gradePlay(timed, "done", 150)).toBe(76);
    expect(gradePlay(quiz, "done", 7)).toBe(70);
    expect(gradePlay(points, "done", 60, 240)).toBe(25);
    expect(gradePlay(lives, "won", 1)).toBe(67);
  });

  it("derrota e desistência valem zero onde é preciso acertar", () => {
    expect(gradePlay(attempts, "lost", 6)).toBe(0);
    expect(gradePlay(unlimited, "lost", 12)).toBe(0);
    expect(gradePlay(lives, "lost", 3)).toBe(0);
  });

  it("para em 100 quando palavras fora da lista passam do máximo da Colmeia", () => {
    expect(gradePlay(points, "won", 260, 240)).toBe(100);
  });

  it("jogo por pontos exige o máximo do desafio", () => {
    expect(() => maxScore(points)).toThrow();
  });
});
