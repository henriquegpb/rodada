import { describe, expect, it } from "vitest";
import { countries } from "../_shared/geo";
import { countriesByContinent } from "./continents";
import { engine } from "./engine";
import map from "./data/map.json";
import type { MundoFeedback } from "./types";
import type { Guess } from "../types";

describe("engine Mundo", () => {
  it("o desafio é a lista inteira, igual todo dia", () => {
    expect(engine.createChallenge("2026-10-22")).toEqual(engine.createChallenge("2026-10-23"));
    expect(engine.createChallenge("2026-10-22").puzzle.total).toBe(countries.length);
  });

  it("aceita nome, sem acento e apelido; recusa desconhecido e repetido", () => {
    const first = engine.checkGuess("japao", null, []);
    expect(first).toMatchObject({ ok: true, solved: false, feedback: { code: "jp", name: "Japão" } });
    if (!first.ok) return;
    expect(engine.checkGuess("EUA", null, [])).toMatchObject({ ok: true, feedback: { code: "us" } });
    expect(engine.checkGuess("Atlântida", null, [])).toMatchObject({ ok: false });
    // Código não vale: senão "Alemanha" seria aceita como Albânia no meio da digitação.
    expect(engine.checkGuess("al", null, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("Japão", null, [{ input: "japao", feedback: first.feedback }])).toMatchObject({
      ok: false,
    });
  });

  it("completar a lista resolve a partida", () => {
    const previous: Guess<MundoFeedback>[] = countries
      .slice(1)
      .map((c) => ({ input: c.name, feedback: { code: c.code, name: c.name } }));
    expect(engine.checkGuess(countries[0].name, null, previous)).toMatchObject({ ok: true, solved: true });
  });
});

describe("dados do Mundo", () => {
  it("todo país está em exatamente um continente da tabela", () => {
    const listed = countriesByContinent.flatMap((c) => c.countries.map((x) => x.code));
    expect(listed.sort()).toEqual(countries.map((c) => c.code).sort());
  });

  it("todo país aparece no mapa, como contorno ou como ponto", () => {
    for (const c of countries) {
      expect(c.code in map.paths || c.code in map.dots, c.code).toBe(true);
    }
  });
});
