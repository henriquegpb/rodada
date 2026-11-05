import { describe, expect, it } from "vitest";
import { getGame } from "@/games";
import { addDays } from "@/lib/daily/date";
import { replayPlay } from "@/lib/plays/replay";
import { gradePlay } from "@/lib/scoring";
import type { Guess } from "../types";
import { ANGLES, engine } from "./engine";
import type { GrauFeedback } from "./types";

const answer = { read: 137, draw: 214 };

function play(inputs: string[]) {
  const guesses: Guess<GrauFeedback>[] = [];
  for (const input of inputs) {
    const r = engine.checkGuess(input, answer, guesses);
    if (!r.ok) throw new Error(r.error);
    guesses.push({ input, feedback: r.feedback });
  }
  return guesses;
}

describe("engine Grau", () => {
  it("desafio determinístico, dentro da lista, e o desenho bate com a resposta", () => {
    for (let i = 0; i < 60; i++) {
      const day = addDays("2026-11-05", i);
      const { puzzle, answer: a } = engine.createChallenge(day);
      expect(engine.createChallenge(day)).toEqual({ puzzle, answer: a });
      expect(ANGLES).toContain(a.read);
      expect(ANGLES).toContain(a.draw);
      expect((puzzle.read.to - puzzle.read.from + 360) % 360).toBe(a.read);
      expect(puzzle.draw.target).toBe(a.draw);
    }
  });

  it("fora dos ângulos fáceis", () => {
    for (const bad of [0, 5, 88, 90, 92, 180, 270, 355]) expect(ANGLES).not.toContain(bad);
  });

  it("erro de até 2° acerta; o resto diz a direção e a faixa", () => {
    expect(engine.checkGuess("120", answer, [])).toMatchObject({ ok: true, solved: false, feedback: { round: 1, heat: 3, dir: 1 } });
    expect(engine.checkGuess("141°", answer, [])).toMatchObject({ ok: true, feedback: { heat: 1, dir: -1 } });
    expect(engine.checkGuess("300", answer, [])).toMatchObject({ ok: true, feedback: { heat: 5 } });
    const hit = engine.checkGuess("139", answer, []);
    expect(hit).toMatchObject({ ok: true, solved: false, feedback: { heat: 0, dir: 0, exact: 137 } });
  });

  it("acertar o 1º passa para o 2º, e acertar o 2º resolve", () => {
    const guesses = play(["120", "136", "222"]);
    expect(guesses.map((g) => g.feedback.round)).toEqual([1, 1, 2]);
    expect(guesses[2].feedback).toMatchObject({ heat: 2, dir: -1 });
    expect(engine.checkGuess("215", answer, guesses)).toMatchObject({ ok: true, solved: true, feedback: { round: 2, exact: 214 } });
  });

  it("recusa número inválido e repetido no mesmo ângulo", () => {
    for (const bad of ["", "abc", "0", "360", "12.5"]) expect(engine.checkGuess(bad, answer, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("120", answer, play(["120"]))).toMatchObject({ ok: false });
    // O mesmo número vale no outro ângulo.
    expect(engine.checkGuess("137", answer, play(["137"]))).toMatchObject({ ok: true, feedback: { round: 2 } });
  });

  it("as 7 tentativas valem para os dois; 2 é o mínimo e vale 100", () => {
    const { rules } = getGame("grau")!.meta;
    const won = replayPlay(engine, rules, answer, ["137", "214"], false);
    expect(won).toMatchObject({ ok: true, status: "won", count: 2 });
    const lost = replayPlay(engine, rules, answer, ["100", "110", "120", "130", "137", "250", "240"], false);
    expect(lost).toMatchObject({ ok: true, status: "lost", count: 7 });
    expect([2, 3, 4, 5, 6, 7].map((n) => gradePlay(rules, "won", n))).toEqual([100, 90, 80, 60, 40, 20]);
    expect(gradePlay(rules, "lost", 7)).toBe(0);
  });
});
