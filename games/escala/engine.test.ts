import { describe, expect, it } from "vitest";
import { getGame } from "@/games";
import { addDays } from "@/lib/daily/date";
import { replayPlay } from "@/lib/plays/replay";
import { gradePlay } from "@/lib/scoring";
import { COUNTRIES, engine as paises } from "../escala-paises/engine";
import { referencesFor } from "./create-engine";
import { ANIMALS, engine } from "./engine";
import { ROUNDS, formatSize, scoreOf } from "./scene";

describe("Escala", () => {
  it.each([
    ["bichos", ANIMALS],
    ["países", COUNTRIES],
  ] as const)("todo alvo dos %s tem pelo menos 2 referências que cabem na cena", (_, pool) => {
    for (const item of pool) expect(referencesFor(pool, item).length, item.name).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ["escala", engine],
    ["escala-paises", paises],
  ] as const)("%s: desafio determinístico, 5 rodadas sem repetir, e o alvo vai sem tamanho", (_, e) => {
    for (let i = 0; i < 40; i++) {
      const day = addDays("2026-11-05", i);
      const { puzzle, answer } = e.createChallenge(day);
      expect(e.createChallenge(day)).toEqual({ puzzle, answer });
      expect(puzzle.rounds).toHaveLength(ROUNDS);
      expect(answer).toHaveLength(ROUNDS);
      const names = puzzle.rounds.flatMap((r) => [r.reference.name, r.target.name]);
      expect(new Set(puzzle.rounds.map((r) => r.target.name)).size).toBe(ROUNDS);
      expect(names.length).toBe(10);
      for (const r of puzzle.rounds) expect(r.target).not.toHaveProperty("size");
    }
  });

  it("nota: 100 em cheio, cai com o erro e zera em 2,5×", () => {
    expect(scoreOf(1, 1)).toBe(100);
    expect(scoreOf(1.31, 1)).toBe(71);
    expect(scoreOf(0.5, 1)).toBe(24);
    expect(scoreOf(2.5, 1)).toBe(0);
    expect(scoreOf(10, 1)).toBe(0);
  });

  it("5 palpites e encerrar dão a soma; o máximo é 500", () => {
    const { rules } = getGame("escala")!.meta;
    const answer = [1, 2, 3, 4, 5];
    const replay = replayPlay(engine, rules, answer, ["1", "2", "3", "4", "10"], true);
    expect(replay).toMatchObject({ ok: true, status: "done", count: 424 });
    expect(gradePlay(rules, "done", 424, engine.maxPoints!({ rounds: [] }))).toBe(85);
    expect(engine.checkGuess("1", answer, Array(5).fill({ input: "1", feedback: {} }))).toMatchObject({ ok: false });
    expect(engine.checkGuess("abc", answer, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("0", answer, [])).toMatchObject({ ok: false });
  });

  it("tamanhos legíveis", () => {
    expect(formatSize(0.015)).toBe("1,5 cm");
    expect(formatSize(0.33)).toBe("33 cm");
    expect(formatSize(1.62)).toBe("1,62 m");
    expect(formatSize(4304000)).toBe("4.304 km");
  });

  it("países com tamanho que faz sentido", () => {
    const br = COUNTRIES.find((c) => c.name === "Brasil")!;
    const cl = COUNTRIES.find((c) => c.name === "Chile")!;
    expect(br.size / 1000).toBeGreaterThan(4000);
    expect(br.size / 1000).toBeLessThan(4600);
    expect(cl.size / 1000).toBeGreaterThan(4000);
  });
});
