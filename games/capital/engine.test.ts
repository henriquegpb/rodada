import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { countries, nameKey } from "../_shared/geo";
import type { Guess } from "../types";
import capitals from "./data/capitals.json";
import { QUESTIONS, engine, type CapitalEntry } from "./engine";
import type { CapitalFeedback } from "./types";

const DAY = "2026-10-23";

/** Responde as perguntas de `answer` com o que `pick` escolher e devolve o resultado da última. */
function play(answer: CapitalEntry[], pick: (entry: CapitalEntry, i: number) => string) {
  const previous: Guess<CapitalFeedback>[] = [];
  let last;
  for (const [i, entry] of answer.entries()) {
    const input = pick(entry, i);
    last = engine.checkGuess(input, answer, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input, feedback: last.feedback });
  }
  return { last: last!, previous };
}

describe("engine Capital", () => {
  it("10 países do dia, do mais fácil ao mais difícil, sem repetir e iguais para todo mundo", () => {
    const { puzzle, answer } = engine.createChallenge(DAY);
    expect(answer).toHaveLength(QUESTIONS);
    expect(new Set(answer.map((e) => e.code)).size).toBe(QUESTIONS);
    expect(answer.map((e) => e.tier)).toEqual([...answer.map((e) => e.tier)].sort());
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(addDays(DAY, 1)).answer).not.toEqual(answer);
    expect(puzzle.questions.every((q) => q.path && q.country)).toBe(true);
  });

  it("as alternativas são 4 capitais diferentes, e uma delas é a certa", () => {
    const { puzzle, answer } = engine.createChallenge(DAY);
    puzzle.questions.forEach((q, i) => {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(answer[i].capital);
    });
  });

  it("o desafio não entrega as respostas", () => {
    const { puzzle } = engine.createChallenge(DAY);
    // A lista de capitais é alfabética e sem o país; as perguntas só têm o país e as alternativas.
    const names = puzzle.cities.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "pt-BR")));
    expect(Object.keys(puzzle.cities[0]).sort()).toEqual(["aliases", "name"]);
    expect(Object.keys(puzzle.questions[0]).sort()).toEqual(["choices", "code", "country", "path"]);
  });

  it("aceita sem acento e grafias alternativas; recusa o que não é capital sem gastar a vez", () => {
    const answer = [{ code: "cn", capital: "Pequim", aliases: ["Beijing"], tier: 1 }];
    expect(engine.checkGuess("pequim", answer, [])).toMatchObject({ ok: true, feedback: { correct: true, city: "Pequim" } });
    expect(engine.checkGuess("Beijing", answer, [])).toMatchObject({ ok: true, feedback: { correct: true, city: "Beijing" } });
    expect(engine.checkGuess("Tóquio", answer, [])).toMatchObject({ ok: true, feedback: { correct: false, answer: "Pequim" } });
    expect(engine.checkGuess("Rio de Janeiro", answer, [])).toMatchObject({ ok: false });
    // A grafia sem acento igual à principal mostra a principal.
    expect(engine.checkGuess("Tripoli", answer, [])).toMatchObject({ ok: true, feedback: { city: "Trípoli" } });
  });

  it("pular conta como erro e revela a resposta", () => {
    const answer = [{ code: "fr", capital: "Paris", aliases: [], tier: 1 }];
    expect(engine.checkGuess("", answer, [])).toMatchObject({
      ok: true,
      solved: false,
      feedback: { city: "", answer: "Paris", correct: false },
    });
  });

  it("acertar todas resolve; errar uma não", () => {
    const { answer } = engine.createChallenge(DAY);
    expect(play(answer, (e) => e.capital).last).toMatchObject({ ok: true, solved: true });
    expect(play(answer, (e, i) => (i === 3 ? "" : e.capital)).last).toMatchObject({ ok: true, solved: false });
    const done = play(answer, (e) => e.capital).previous;
    expect(engine.checkGuess("Paris", answer, done)).toMatchObject({ ok: false });
  });
});

describe("dados do Capital", () => {
  const entries: CapitalEntry[] = capitals;

  it("uma capital para cada país do site", () => {
    expect(entries.map((e) => e.code).sort()).toEqual(countries.map((c) => c.code).sort());
  });

  it("nenhum nome é de duas capitais", () => {
    const owner = new Map<string, string>();
    for (const e of entries) {
      for (const name of [e.capital, ...e.aliases]) {
        const key = nameKey(name);
        expect(owner.get(key) ?? e.code, `${name} em ${owner.get(key)} e ${e.code}`).toBe(e.code);
        owner.set(key, e.code);
      }
    }
  });
});
