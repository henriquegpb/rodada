import { describe, expect, it } from "vitest";
import { addDays, EPOCH_DATE } from "@/lib/daily/date";
import { engine as bandeira } from "../../bandeira/engine";
import { engine as pais } from "../../pais/engine";
import shapes from "../../pais/data/shapes.json";
import {
  bearing,
  countries,
  distanceKm,
  findCountry,
  getCountry,
  proximity,
  proximityEmoji,
  readPrefix,
  searchCountries,
  toDirection,
} from "./index";

const c = (code: string) => getCountry(code)!;

describe("busca de países", () => {
  it("acha por nome, sem acento, por apelido e por código", () => {
    expect(findCountry("Japão")?.code).toBe("jp");
    expect(findCountry("japao")?.code).toBe("jp");
    expect(findCountry("  EUA ")?.code).toBe("us");
    expect(findCountry("Holanda")?.code).toBe("nl");
    expect(findCountry("br")?.code).toBe("br");
    expect(findCountry("Atlântida")).toBeUndefined();
  });

  it("autocomplete prioriza quem começa com o texto", () => {
    expect(searchCountries("bra")[0].code).toBe("br");
    expect(searchCountries("guin").map((x) => x.code)).toEqual(expect.arrayContaining(["gn", "gw", "gq", "pg"]));
  });

  it("os nomes são únicos", () => {
    expect(new Set(countries.map((x) => x.name)).size).toBe(countries.length);
  });
});

describe("distância e direção", () => {
  it("distância entre centroides é plausível", () => {
    expect(distanceKm(c("br"), c("ar"))).toBeGreaterThan(1500);
    expect(distanceKm(c("br"), c("ar"))).toBeLessThan(3000);
    expect(distanceKm(c("br"), c("br"))).toBe(0);
  });

  it("direção aponta do chute para a resposta", () => {
    expect(toDirection(bearing(c("br"), c("ar")))).toMatch(/^S/);
    expect(toDirection(bearing(c("ar"), c("br")))).toMatch(/^N/);
    expect(toDirection(bearing(c("pt"), c("es")))).toBe("E");
  });

  it("proximidade vai de 0 a 100", () => {
    expect(proximity(0)).toBe(100);
    expect(proximity(20_000)).toBe(0);
    expect(proximity(30_000)).toBe(0);
  });

  it("compartilhamento tem 5 quadrados e seta", () => {
    expect(proximityEmoji({ proximity: 87, direction: "NE" })).toBe("🟧🟧🟧🟧⬛ ↗️");
    expect(proximityEmoji({ proximity: 100, direction: null })).toBe("🟧🟧🟧🟧🟧 🎯");
  });
});

describe.each([
  ["bandeira", bandeira],
  ["pais", pais],
])("engine %s", (_, engine) => {
  it("é determinística por data", () => {
    for (let i = 0; i < 20; i++) {
      const day = addDays(EPOCH_DATE, i);
      expect(engine.createChallenge(day)).toEqual(engine.createChallenge(day));
    }
  });

  it("valida acerto, erro, país desconhecido e repetição", () => {
    const { answer } = engine.createChallenge("2026-10-22");
    const right = engine.checkGuess(getCountry(answer)!.name, answer, []);
    expect(right).toMatchObject({ ok: true, solved: true, feedback: { distanceKm: 0, direction: null, proximity: 100 } });

    const otherCode = answer === "br" ? "jp" : "br";
    const wrong = engine.checkGuess(otherCode, answer, []);
    expect(wrong).toMatchObject({ ok: true, solved: false, feedback: { code: otherCode } });
    if (!wrong.ok) return;
    expect(wrong.feedback.distanceKm).toBeGreaterThan(0);

    expect(engine.checkGuess("Narnia", answer, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess(otherCode, answer, [{ input: otherCode, feedback: wrong.feedback }])).toMatchObject({
      ok: false,
    });
  });

  it("o puzzle não expõe o nome do país", () => {
    const { puzzle, answer } = engine.createChallenge("2026-10-22");
    expect(JSON.stringify(puzzle)).not.toContain(getCountry(answer)!.name);
  });
});

describe("dados de país", () => {
  it("toda resposta do País tem silhueta e não é microestado", () => {
    for (let i = 0; i < 200; i++) {
      const { answer, puzzle } = pais.createChallenge(addDays(EPOCH_DATE, i));
      expect(c(answer).shapeEligible).toBe(true);
      expect(puzzle.path.length).toBeGreaterThan(20);
    }
    expect(Object.keys(shapes)).toHaveLength(countries.length);
  });
});

describe("readPrefix (aceite pelo começo do nome)", () => {
  const all = countries;
  const without = (...codes: string[]) => countries.filter((c) => !codes.includes(c.code));

  it("aceita quando só pode ser um país e faltam até 2 letras", () => {
    expect(readPrefix("bra", all).match).toBeUndefined();
    expect(readPrefix("bras", all).match?.code).toBe("br");
    expect(readPrefix("alema", all).match).toBeUndefined();
    expect(readPrefix("aleman", all).match?.code).toBe("de");
  });

  it("nomes longos: 8 letras digitadas bastam", () => {
    expect(readPrefix("estados", all).match).toBeUndefined();
    expect(readPrefix("estados ", all).match).toBeUndefined();
    expect(readPrefix("estados u", all).match?.code).toBe("us");
  });

  it("nome completo que é começo de outro espera o Enter", () => {
    expect(readPrefix("niger", all)).toEqual({ exact: getCountry("ne"), open: true });
    expect(readPrefix("ira", all)).toEqual({ exact: getCountry("ir"), open: true });
    expect(readPrefix("nigeri", all).match?.code).toBe("ng");
  });

  it("só considera os países que ainda faltam", () => {
    expect(readPrefix("nige", all).match).toBeUndefined();
    expect(readPrefix("nige", without("ne")).match).toBeUndefined();
    expect(readPrefix("niger", without("ne")).match?.code).toBe("ng");
  });

  it("aceita inglês e espanhol", () => {
    expect(findCountry("Germany")?.code).toBe("de");
    expect(findCountry("Alemania")?.code).toBe("de");
    expect(findCountry("Ivory Coast")?.code).toBe("ci");
    expect(readPrefix("switzerla", all).match?.code).toBe("ch");
  });

  it("ignora apóstrofo e hífen", () => {
    expect(findCountry("cote divoire")?.code).toBe("ci");
    expect(findCountry("guine bissau")?.code).toBe("gw");
  });
});
