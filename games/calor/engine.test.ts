import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { getCountry } from "../_shared/geo";
import { borders } from "../_shared/geo/borders";
import { borderDistance, engine } from "./engine";
import { heatColor } from "./heat";

describe("distância entre fronteiras", () => {
  it("vizinhos ficam a 0 km e a tabela é simétrica", () => {
    expect(borderDistance("br", "ar")).toBe(0);
    expect(borderDistance("ar", "br")).toBe(0);
    for (const n of borders.de) expect(borderDistance("de", n)).toBe(0);
  });

  it("bate com a geografia", () => {
    expect(borderDistance("gb", "fr")).toBeLessThan(100); // Canal da Mancha
    expect(borderDistance("es", "ma")).toBeLessThan(50); // Gibraltar
    expect(borderDistance("pt", "jp")).toBeGreaterThan(9000);
    expect(borderDistance("br", "br")).toBe(0);
  });
});

describe("engine Calor", () => {
  it("desafio determinístico, sem microestados, e o puzzle não entrega nada", () => {
    for (let i = 0; i < 30; i++) {
      const day = addDays("2026-10-22", i);
      const { puzzle, answer } = engine.createChallenge(day);
      expect(engine.createChallenge(day).answer).toBe(answer);
      expect(getCountry(answer)!.shapeEligible).toBe(true);
      expect(puzzle).toEqual({});
    }
  });

  it("cada chute traz a distância; acertar resolve", () => {
    expect(engine.checkGuess("Argentina", "br", [])).toMatchObject({ ok: true, solved: false, feedback: { km: 0 } });
    expect(engine.checkGuess("Japão", "br", [])).toMatchObject({ ok: true, solved: false });
    expect(engine.checkGuess("Brasil", "br", [])).toMatchObject({ ok: true, solved: true, feedback: { km: 0 } });
  });

  it("recusa desconhecido e repetido", () => {
    expect(engine.checkGuess("Narnia", "br", [])).toMatchObject({ ok: false });
    const first = engine.checkGuess("Chile", "br", []);
    if (!first.ok) throw new Error();
    expect(engine.checkGuess("chile", "br", [{ input: "Chile", feedback: first.feedback }])).toMatchObject({ ok: false });
  });

  it("a cor esquenta conforme chega perto", () => {
    expect(heatColor(0)).not.toBe(heatColor(5000));
    expect(heatColor(20_000)).toBe(heatColor(30_000));
  });
});
