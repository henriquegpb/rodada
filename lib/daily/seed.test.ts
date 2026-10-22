import { describe, expect, it } from "vitest";
import { addDays, EPOCH_DATE } from "./date";
import { createRng, pickDaily, shuffle } from "./seed";

const pool = Array.from({ length: 50 }, (_, i) => `item-${i}`);
const days = (n: number, from = EPOCH_DATE) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe("createRng", () => {
  it("é determinístico e fica em [0, 1)", () => {
    const a = createRng("x");
    const b = createRng("x");
    const values = Array.from({ length: 1000 }, () => a());
    expect(values).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it("seeds diferentes geram sequências diferentes", () => {
    expect(createRng("a")()).not.toBe(createRng("b")());
  });
});

describe("shuffle", () => {
  it("é uma permutação e não altera a lista original", () => {
    const copy = [...pool];
    const shuffled = shuffle(pool, createRng("s"));
    expect(pool).toEqual(copy);
    expect([...shuffled].sort()).toEqual([...pool].sort());
    expect(shuffled).not.toEqual(pool);
  });
});

describe("pickDaily", () => {
  const opts = (dateKey: string, seed = "teste") => ({ slug: "jogo", dateKey, seed });

  it("o mesmo dia sempre dá o mesmo desafio", () => {
    for (const day of days(30)) {
      expect(pickDaily(pool, opts(day))).toBe(pickDaily(pool, opts(day)));
    }
  });

  it("não repete até percorrer a lista inteira", () => {
    const picks = days(pool.length).map((d) => pickDaily(pool, opts(d)));
    expect(new Set(picks).size).toBe(pool.length);
  });

  it("o ciclo seguinte também cobre a lista inteira, em outra ordem", () => {
    const first = days(pool.length).map((d) => pickDaily(pool, opts(d)));
    const second = days(pool.length, addDays(EPOCH_DATE, pool.length)).map((d) => pickDaily(pool, opts(d)));
    expect(new Set(second).size).toBe(pool.length);
    expect(second).not.toEqual(first);
  });

  it("o segredo muda a sequência; o jogo também", () => {
    const a = days(10).map((d) => pickDaily(pool, opts(d, "um")));
    const b = days(10).map((d) => pickDaily(pool, opts(d, "outro")));
    const c = days(10).map((d) => pickDaily(pool, { slug: "outro-jogo", dateKey: d, seed: "um" }));
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("funciona antes do dia #1", () => {
    expect(pool).toContain(pickDaily(pool, opts(addDays(EPOCH_DATE, -3))));
  });
});
