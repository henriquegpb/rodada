import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { countries, getCountry } from "../_shared/geo";
import type { Guess } from "../types";
import { QUESTIONS, TIERS, engine } from "./engine";
import type { BandeiraFeedback } from "./types";

const DAY = "2026-10-29";
const name = (code: string) => getCountry(code)!.name;

/** Responde as perguntas de `answer` com o que `pick` escolher e devolve o resultado da última. */
function play(answer: string[], pick: (code: string, i: number) => string) {
  const previous: Guess<BandeiraFeedback>[] = [];
  let last;
  for (const [i, code] of answer.entries()) {
    const input = pick(code, i);
    last = engine.checkGuess(input, answer, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input, feedback: last.feedback });
  }
  return { last: last!, previous };
}

describe("engine Bandeira", () => {
  it("10 bandeiras do dia, da mais fácil à mais difícil, sem repetir e iguais para todo mundo", () => {
    const { answer } = engine.createChallenge(DAY);
    const tierOf = (code: string) => Number(Object.keys(TIERS).find((t) => TIERS[t].includes(code)));
    expect(answer).toHaveLength(QUESTIONS);
    expect(new Set(answer).size).toBe(QUESTIONS);
    expect(answer.map(tierOf)).toEqual([...answer.map(tierOf)].sort());
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(addDays(DAY, 1)).answer).not.toEqual(answer);
  });

  it("as alternativas são 4 países diferentes, e um deles é o certo", () => {
    const { puzzle, answer } = engine.createChallenge(DAY);
    puzzle.questions.forEach((q, i) => {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(name(answer[i]));
    });
  });

  it("aceita nome sem acento e apelidos; recusa o que não é país sem gastar a vez", () => {
    const answer = ["de"];
    expect(engine.checkGuess("alemanha", answer, [])).toMatchObject({ ok: true, feedback: { correct: true, name: "Alemanha" } });
    expect(engine.checkGuess("Germany", answer, [])).toMatchObject({ ok: true, feedback: { correct: true } });
    expect(engine.checkGuess("Áustria", answer, [])).toMatchObject({ ok: true, feedback: { correct: false, answer: "Alemanha" } });
    expect(engine.checkGuess("Narnia", answer, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("de", answer, [])).toMatchObject({ ok: false });
  });

  it("pular conta como erro e revela a resposta", () => {
    expect(engine.checkGuess("", ["fr"], [])).toMatchObject({
      ok: true,
      solved: false,
      feedback: { name: "", answer: "França", correct: false },
    });
  });

  it("acertar todas resolve; errar uma não", () => {
    const { answer } = engine.createChallenge(DAY);
    expect(play(answer, name).last).toMatchObject({ ok: true, solved: true });
    expect(play(answer, (code, i) => (i === 3 ? "" : name(code))).last).toMatchObject({ ok: true, solved: false });
    const done = play(answer, name).previous;
    expect(engine.checkGuess("Brasil", answer, done)).toMatchObject({ ok: false });
  });
});

describe("dados do Bandeira", () => {
  it("cada país do site está em exatamente um nível", () => {
    const all = Object.values(TIERS).flat();
    expect(all.sort()).toEqual(countries.map((c) => c.code).sort());
    expect(Object.keys(TIERS).sort()).toEqual(["1", "2", "3"]);
  });
});
