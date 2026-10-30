import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { normalize } from "@/lib/normalize";
import { formatResult, playCount } from "@/lib/plays/result";
import type { Guess } from "../types";
import { PUZZLES, engine, type ColmeiaEntry } from "./engine";
import { colmeia } from "./index";
import { RANKS, isPangram, rankIndex, rankThresholds, wordPoints } from "./score";
import type { ColmeiaFeedback } from "./types";

const DAY = "2026-10-29";

const ENTRY: ColmeiaEntry = {
  letters: "acdeilr",
  center: "i",
  words: ["cadeira", "cidade", "cidadã", "ideia", "lira", "radical", "realidade"],
  extra: ["lírica"],
};

function play(entry: ColmeiaEntry, inputs: string[]) {
  const previous: Guess<ColmeiaFeedback>[] = [];
  let last;
  for (const input of inputs) {
    last = engine.checkGuess(input, entry, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input, feedback: last.feedback });
  }
  return { previous, last: last! };
}

describe("engine Colmeia", () => {
  it("colmeia do dia determinística e diferente no dia seguinte", () => {
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(addDays(DAY, 1)).answer).not.toEqual(engine.createChallenge(DAY).answer);
  });

  it("o desafio tem 6 letras de fora, a do meio e os totais, sem as palavras", () => {
    const { puzzle, answer } = engine.createChallenge(DAY);
    expect(puzzle.outer).toHaveLength(6);
    expect([...puzzle.outer, puzzle.center].sort().join("")).toBe(answer.letters);
    expect(puzzle.totalWords).toBe(answer.words.length);
    const text = JSON.stringify(puzzle);
    for (const word of answer.words) expect(text).not.toContain(`"${normalize(word)}"`);
  });

  it("pontua 1 para 4 letras, 1 por letra acima disso e +7 no pangrama", () => {
    expect(wordPoints("lira")).toBe(1);
    expect(wordPoints("ideia")).toBe(5);
    expect(wordPoints("radical")).toBe(7);
    expect(isPangram("realidade")).toBe(false);
    expect(wordPoints("cadeira")).toBe(7);
    const [, , pangram] = play(ENTRY, ["lira", "ideia", "cidade"]).previous;
    expect(pangram.feedback).toMatchObject({ word: "cidade", points: 6, pangram: false });
  });

  it("acento e cedilha não importam; mostra a grafia da lista", () => {
    expect(engine.checkGuess("cidada", ENTRY, [])).toMatchObject({ ok: true, feedback: { word: "cidadã" } });
    expect(engine.checkGuess("IDEIA", ENTRY, [])).toMatchObject({ ok: true, feedback: { word: "ideia" } });
  });

  it("recusa sem gastar nada: curta, sem a do meio, letra de fora, fora da lista, repetida", () => {
    expect(engine.checkGuess("ira", ENTRY, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("cela", ENTRY, [])).toMatchObject({ ok: false, error: expect.stringContaining("meio") });
    expect(engine.checkGuess("cidades", ENTRY, [])).toMatchObject({ ok: false, error: expect.stringContaining("fora") });
    expect(engine.checkGuess("ilidir", ENTRY, [])).toMatchObject({ ok: false });
    const { previous } = play(ENTRY, ["lira"]);
    expect(engine.checkGuess("lira", ENTRY, previous)).toMatchObject({ ok: false });
  });

  it("extra vale pontos, mas não conta para achar todas", () => {
    expect(engine.checkGuess("lirica", ENTRY, [])).toMatchObject({ ok: true, solved: false, feedback: { word: "lírica", points: 6, extra: true } });
    const { last } = play(ENTRY, ["lírica", ...ENTRY.words]);
    expect(last).toMatchObject({ ok: true, solved: true });
    expect(play(ENTRY, ENTRY.words.slice(0, -1)).last).toMatchObject({ solved: false });
  });

  it("achar todas resolve", () => {
    const { last } = play(ENTRY, ENTRY.words);
    expect(last).toMatchObject({ ok: true, solved: true });
  });

  it("placar soma os pontos", () => {
    const { previous } = play(ENTRY, ["lira", "ideia"]);
    expect(playCount(colmeia.meta.rules, previous)).toBe(6);
    expect(formatResult(colmeia.meta.rules, "done", 6)).toBe("6 pts");
  });

  it("níveis sobem com os pontos e Gênio fica em 70%", () => {
    expect(rankIndex(0, 200)).toBe(0);
    expect(rankThresholds(200).at(-1)).toBe(140);
    expect(RANKS[rankIndex(140, 200)].name).toBe("Gênio");
    expect(RANKS[rankIndex(139, 200)].name).toBe("Incrível");
  });
});

describe("dados da Colmeia", () => {
  it("cada colmeia tem 7 letras, a do meio entre elas, e palavras válidas", () => {
    for (const p of PUZZLES) {
      expect(new Set(p.letters).size).toBe(7);
      expect(p.letters).toContain(p.center);
      expect(p.words.length).toBeGreaterThanOrEqual(25);
      expect(p.words.length).toBeLessThanOrEqual(65);
      expect(p.words.some((w) => isPangram(normalize(w)))).toBe(true);
      for (const w of p.words) {
        const key = normalize(w);
        expect(key.length).toBeGreaterThanOrEqual(4);
        expect(key).toContain(p.center);
        expect([...key].every((c) => p.letters.includes(c))).toBe(true);
      }
    }
  });

  it("extras seguem as mesmas regras e não repetem a lista oficial", () => {
    for (const p of PUZZLES) {
      const official = new Set(p.words.map(normalize));
      for (const w of p.extra) {
        const key = normalize(w);
        expect(official.has(key), w).toBe(false);
        expect(key).toContain(p.center);
        expect([...key].every((c) => p.letters.includes(c))).toBe(true);
      }
    }
  });

  it("sem palavrão nem grafia antiga", () => {
    const all = new Set(PUZZLES.flatMap((p) => [...p.words, ...p.extra]));
    for (const w of ["fode", "porra", "merda", "caralho", "tecto", "correcto", "acção"]) expect(all.has(w), w).toBe(false);
  });
});
