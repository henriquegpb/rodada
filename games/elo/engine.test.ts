import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/normalize";
import { addDays, EPOCH_DATE } from "@/lib/daily/date";
import type { Guess } from "../types";
import { engine, GROUP_SIZE, puzzles } from "./engine";
import { formatGroups, GUESS_SEPARATOR, parseGroups, SEPARATORS } from "./text";
import type { EloFeedback, EloGroup } from "./types";

/** Cabe numa casa da grade 4×4 no celular sem quebrar a palavra. */
const MAX_WORD_LENGTH = 10;

describe("desafios", () => {
  it.each(puzzles.map((p, i) => [i + 1, p] as const))("#%i tem 4 grupos de 4, um por nível", (_, { groups }) => {
    expect(groups).toHaveLength(4);
    expect(groups.map((g) => g.level)).toEqual([0, 1, 2, 3]);
    for (const g of groups) {
      expect(g.words).toHaveLength(GROUP_SIZE);
      expect(g.label.trim()).not.toBe("");
    }
  });

  it.each(puzzles.map((p, i) => [i + 1, p] as const))("#%i tem 16 palavras diferentes", (_, { groups }) => {
    const words = groups.flatMap((g) => g.words).map(normalize);
    expect(new Set(words).size).toBe(16);
  });

  it("palavras em maiúsculas, curtas e sem os separadores do texto", () => {
    for (const { groups } of puzzles) {
      for (const g of groups) {
        for (const text of [g.label, ...g.words]) {
          for (const sep of SEPARATORS) expect(text).not.toContain(sep);
        }
        for (const w of g.words) {
          expect(w).toBe(w.toUpperCase());
          expect(w.length, w).toBeLessThanOrEqual(MAX_WORD_LENGTH);
        }
      }
    }
  });

  it("nenhum grupo se repete entre desafios", () => {
    const keys = puzzles.flatMap((p) => p.groups.map((g) => g.words.map(normalize).sort().join()));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("createChallenge", () => {
  it("é determinístico para a mesma data", () => {
    expect(engine.createChallenge("2026-10-22")).toEqual(engine.createChallenge("2026-10-22"));
  });

  it("não repete desafio enquanto a lista não acaba", () => {
    const seen = new Set<string>();
    for (let i = 0; i < puzzles.length; i++) {
      seen.add(JSON.stringify(engine.createChallenge(addDays(EPOCH_DATE, i)).answer));
    }
    expect(seen.size).toBe(puzzles.length);
  });

  it("a grade traz as 16 palavras e nada dos grupos", () => {
    const { puzzle, answer } = engine.createChallenge("2026-10-22");
    expect(Object.keys(puzzle)).toEqual(["words"]);
    expect([...puzzle.words].sort()).toEqual(answer.flatMap((g) => g.words).sort());
    const serialized = JSON.stringify(puzzle);
    for (const g of answer) expect(serialized).not.toContain(g.label);
  });
});

describe("checkGuess", () => {
  const answer = puzzles[0].groups; // Frutas · Partes da camisa · Percussão · Escondem um animal
  const [fruits, shirt, drums, hidden] = answer;
  const join = (words: string[]) => words.join(GUESS_SEPARATOR);

  /** Joga uma sequência de chutes e devolve o histórico, como o serviço guardaria. */
  function playAll(inputs: string[][]): Guess<EloFeedback>[] {
    const previous: Guess<EloFeedback>[] = [];
    for (const words of inputs) {
      const result = engine.checkGuess(join(words), answer, previous);
      if (!result.ok) throw new Error(result.error);
      previous.push({ input: join(words), feedback: result.feedback });
    }
    return previous;
  }

  it("acerta um grupo em qualquer ordem e sem acento", () => {
    const result = engine.checkGuess(join(["figo", "Pera", "caju", "MANGA"]), answer, []);
    expect(result).toMatchObject({ ok: true, solved: false, feedback: { group: fruits, oneAway: false } });
    if (result.ok) expect(result.feedback.words).toEqual(["FIGO", "PERA", "CAJU", "MANGA"]);
  });

  it("avisa quando faltou uma", () => {
    const result = engine.checkGuess(join(["MANGA", "CAJU", "PERA", "GOLA"]), answer, []);
    expect(result).toMatchObject({ ok: true, solved: false, feedback: { group: null, oneAway: true } });
  });

  it("erro comum não é 'quase'", () => {
    const result = engine.checkGuess(join(["MANGA", "CAJU", "GOLA", "PUNHO"]), answer, []);
    expect(result).toMatchObject({ ok: true, feedback: { group: null, oneAway: false } });
  });

  it("recusa sem gastar chute: menos de 4, repetidas, fora do jogo", () => {
    expect(engine.checkGuess(join(["MANGA", "CAJU", "PERA"]), answer, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess(join(["MANGA", "MANGA", "PERA", "FIGO"]), answer, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess(join(["MANGA", "CAJU", "PERA", "UVA"]), answer, [])).toMatchObject({ ok: false });
  });

  it("recusa palavra de grupo já achado e chute repetido", () => {
    const previous = playAll([fruits.words, ["GOLA", "PUNHO", "BOTÃO", "CAIXA"]]);
    expect(engine.checkGuess(join(["MANGA", "GOLA", "PUNHO", "BOTÃO"]), answer, previous)).toMatchObject({ ok: false });
    expect(engine.checkGuess(join(["CAIXA", "BOTÃO", "PUNHO", "GOLA"]), answer, previous)).toMatchObject({ ok: false });
  });

  it("só vence achando os 4 grupos, inclusive o último", () => {
    const two = playAll([hidden.words, fruits.words]);
    expect(engine.checkGuess(join(drums.words), answer, two)).toMatchObject({ ok: true, solved: false });
    const three = playAll([hidden.words, fruits.words, drums.words]);
    expect(engine.checkGuess(join(shirt.words), answer, three)).toMatchObject({ ok: true, solved: true });
  });

  it("refazer os chutes dá o mesmo feedback (o serviço confere isso)", () => {
    const first = playAll([["MANGA", "CAJU", "PERA", "GOLA"], fruits.words, shirt.words]);
    const again = playAll(first.map((g) => g.input.split(GUESS_SEPARATOR)));
    expect(JSON.stringify(again)).toBe(JSON.stringify(first));
  });
});

describe("texto da resposta", () => {
  it("o tabuleiro remonta os grupos a partir do texto", () => {
    for (const { groups } of puzzles) {
      expect(parseGroups(formatGroups(groups))).toEqual(groups satisfies EloGroup[]);
    }
  });
});
