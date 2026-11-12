import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import type { Guess, PlayView } from "../types";
import { categoryOf, engine, farEnough, POOL } from "./engine";
import { ordemShareGrid } from "./Recap";
import { CATEGORIES, CATEGORY_IDS, encodeOrder, formatArea, formatDollars, formatPeople, SIZE } from "./rules";
import type { OrdemFeedback, OrdemPuzzle } from "./types";

const DAY = "2026-11-09";
const days = Array.from({ length: 365 }, (_, i) => addDays(DAY, i));

describe("desafio do Ordem", () => {
  it("é determinístico para a mesma data e muda de um dia para o outro", () => {
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(DAY).answer.order).not.toEqual(engine.createChallenge(addDays(DAY, 1)).answer.order);
  });

  it("todo dia tem 5 países diferentes do grupo dos conhecidos, com números bem separados", () => {
    const pool = new Set(POOL.map((c) => c.code));
    for (const day of days) {
      const { puzzle, answer } = engine.createChallenge(day);
      const codes = puzzle.items.map((i) => i.code);
      expect(new Set(codes).size).toBe(SIZE);
      for (const code of codes) expect(pool.has(code)).toBe(true);
      const values = answer.order.map((c) => answer.values[c]);
      for (let i = 1; i < values.length; i++) {
        expect(values[i - 1]).toBeGreaterThan(values[i]);
        expect(farEnough(answer.category, values[i - 1], values[i])).toBe(true);
      }
    }
  });

  it("a categoria muda e passa por todas antes de repetir", () => {
    const week = days.slice(0, CATEGORY_IDS.length).map(categoryOf);
    expect(new Set(week).size).toBe(CATEGORY_IDS.length);
    for (const day of days) expect(engine.createChallenge(day).puzzle.category).toBe(categoryOf(day));
  });

  it("o puzzle traz a categoria, mas não os números nem a ordem certa", () => {
    let sameAsAnswer = 0;
    for (const day of days) {
      const { puzzle, answer } = engine.createChallenge(day);
      expect(Object.keys(puzzle).sort()).toEqual(["category", "items"]);
      for (const item of puzzle.items) expect(Object.keys(item).sort()).toEqual(["code", "name"]);
      if (encodeOrder(puzzle.items.map((i) => i.code)) === encodeOrder(answer.order)) sameAsAnswer++;
    }
    // Ao acaso, a ordem mostrada bate com a resposta 1 vez em 120; mais que isso seria pista.
    expect(sameAsAnswer).toBeLessThan(10);
  });

  it("recusa data inválida em vez de inventar um desafio", () => {
    expect(() => engine.createChallenge("2026-11-31")).toThrow();
  });
});

describe("tentativas do Ordem", () => {
  const { answer } = engine.createChallenge(DAY);
  const right = encodeOrder(answer.order);
  const reversed = encodeOrder([...answer.order].reverse());

  it("a ordem certa resolve e mostra o número de todos", () => {
    const check = engine.checkGuess(right, answer, []);
    expect(check).toMatchObject({ ok: true, solved: true });
    if (check.ok) {
      expect(check.feedback.marks.every((m) => m === "correct")).toBe(true);
      expect(check.feedback.values).toEqual(answer.order.map((c) => answer.values[c]));
    }
  });

  it("marca só as posições certas, sem dizer para onde os outros vão", () => {
    const check = engine.checkGuess(reversed, answer, []);
    expect(check).toMatchObject({ ok: true, solved: false });
    if (check.ok) {
      // Invertida, só o do meio fica no lugar.
      expect(check.feedback.marks).toEqual(["wrong", "wrong", "correct", "wrong", "wrong"]);
      expect(check.feedback.values.filter((a) => a !== null)).toHaveLength(1);
    }
  });

  it("recusa o que não é uma ordem dos 5 países do dia, sem gastar tentativa", () => {
    const [a, b, c, d] = answer.order;
    for (const input of ["", "constructor", `${a},${b},${c},${d}`, `${a},${a},${b},${c},${d}`, `${a},${b},${c},${d},zz`]) {
      expect(engine.checkGuess(input, answer, [])).toMatchObject({ ok: false });
    }
  });

  it("não aceita repetir uma ordem", () => {
    const first = engine.checkGuess(reversed, answer, []);
    if (!first.ok) throw new Error(first.error);
    const previous: Guess<OrdemFeedback>[] = [{ input: reversed, feedback: first.feedback }];
    expect(engine.checkGuess(reversed, answer, previous)).toMatchObject({ ok: false, error: "Você já tentou essa ordem" });
  });

  it("a resposta revelada diz a categoria e lista os países com o número, do maior para o menor", () => {
    const text = engine.describeAnswer(answer);
    expect(text.startsWith(`${CATEGORIES[answer.category].label}: 1º `)).toBe(true);
    expect(text.split(" · ")).toHaveLength(SIZE);
  });
});

describe("números e compartilhamento", () => {
  it("escreve os números de um jeito curto", () => {
    expect(formatArea(17_098_246)).toBe("17,1 mi km²");
    expect(formatArea(92_212)).toBe("92 mil km²");
    expect(formatArea(316)).toBe("316 km²");
    expect(formatPeople(212_812_405)).toBe("212,8 milhões");
    expect(formatPeople(1_438_069_596)).toBe("1,44 bilhão");
    expect(formatPeople(843_000)).toBe("843 mil");
    expect(formatDollars(2_279_920_092_492)).toBe("US$ 2,28 tri");
    expect(formatDollars(450_200_000_000)).toBe("US$ 450 bi");
    expect(formatDollars(12_340_000_000)).toBe("US$ 12,3 bi");
    expect(formatDollars(10_713)).toBe("US$ 10.713");
  });

  it("a grade diz a categoria e tem uma linha por tentativa, sem nome de país", () => {
    const { puzzle, answer } = engine.createChallenge(DAY);
    const reversed = [...answer.order].reverse();
    const first = engine.checkGuess(encodeOrder(reversed), answer, []);
    const second = engine.checkGuess(encodeOrder(answer.order), answer, []);
    if (!first.ok || !second.ok) throw new Error("tentativa recusada");
    const play: PlayView<OrdemPuzzle, OrdemFeedback> = {
      slug: "ordem",
      dateKey: DAY,
      number: 19,
      puzzle,
      status: "won",
      guesses: [
        { input: encodeOrder(reversed), feedback: first.feedback },
        { input: encodeOrder(answer.order), feedback: second.feedback },
      ],
    };
    const { emoji, label } = CATEGORIES[puzzle.category];
    expect(ordemShareGrid(play)).toBe(`${emoji} ${label}\n⬛⬛🟩⬛⬛\n🟩🟩🟩🟩🟩`);
  });
});
