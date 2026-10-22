import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { getCountry } from "../_shared/geo";
import { borderDistances } from "../_shared/geo/borders";
import { candidatePairs, engine, MAX_STOPS, MIN_STOPS } from "./engine";
import type { RotaFeedback } from "./types";
import type { Guess } from "../types";

const guessAll = (start: string, end: string, names: string[]) => {
  const previous: Guess<RotaFeedback>[] = [];
  let last;
  for (const name of names) {
    last = engine.checkGuess(name, { start, end }, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input: name, feedback: last.feedback });
  }
  return { last: last!, previous };
};

describe("engine Rota", () => {
  it("o desafio é determinístico e tem de 3 a 5 países no caminho mais curto", () => {
    for (let i = 0; i < 30; i++) {
      const day = addDays("2026-10-22", i);
      const { puzzle } = engine.createChallenge(day);
      expect(engine.createChallenge(day).puzzle).toEqual(puzzle);
      expect(puzzle.route.length).toBeGreaterThanOrEqual(MIN_STOPS);
      expect(puzzle.route.length).toBeLessThanOrEqual(MAX_STOPS);
      expect(borderDistances(puzzle.start).get(puzzle.end)).toBe(puzzle.route.length + 1);
      expect(getCountry(puzzle.start)!.shapeEligible && getCountry(puzzle.end)!.shapeEligible).toBe(true);
    }
    expect(candidatePairs().length).toBeGreaterThan(365);
  });

  it("classifica chutes: no caminho, perto e longe", () => {
    // Portugal → Polônia: Espanha, França, Alemanha estão no caminho mais curto.
    const { previous } = guessAll("pt", "pl", ["Espanha", "Suíça", "Japão"]);
    expect(previous.map((g) => g.feedback.verdict)).toEqual(["route", "near", "far"]);
  });

  it("ganha quando os chutes ligam a partida ao destino", () => {
    const partial = guessAll("pt", "pl", ["Espanha", "França"]);
    expect(partial.last).toMatchObject({ ok: true, solved: false });
    const done = guessAll("pt", "pl", ["Espanha", "França", "Alemanha"]);
    expect(done.last).toMatchObject({ ok: true, solved: true });
  });

  it("recusa a partida, o destino, repetidos e desconhecidos", () => {
    expect(engine.checkGuess("Portugal", { start: "pt", end: "pl" }, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("Polônia", { start: "pt", end: "pl" }, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("Narnia", { start: "pt", end: "pl" }, [])).toMatchObject({ ok: false });
    const { previous } = guessAll("pt", "pl", ["Espanha"]);
    expect(engine.checkGuess("Espanha", { start: "pt", end: "pl" }, previous)).toMatchObject({ ok: false });
  });

  it("revela um caminho mais curto no fim", () => {
    expect(engine.describeAnswer({ start: "pt", end: "fr" })).toBe("Portugal → Espanha → França");
  });
});
