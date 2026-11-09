import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import type { Guess, PlayView } from "../types";
import { engine, MIN_RATIO, POOL } from "./engine";
import { ordemShareGrid } from "./Recap";
import { encodeOrder, formatArea, SIZE } from "./rules";
import type { OrdemFeedback, OrdemPuzzle } from "./types";

const DAY = "2026-11-09";
const days = Array.from({ length: 365 }, (_, i) => addDays(DAY, i));

describe("desafio do Ordem", () => {
  it("é determinístico para a mesma data e muda de um dia para o outro", () => {
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(DAY).answer.order).not.toEqual(engine.createChallenge(addDays(DAY, 1)).answer.order);
  });

  it("todo dia tem 5 países diferentes do grupo dos conhecidos, com áreas bem separadas", () => {
    const pool = new Set(POOL.map((c) => c.code));
    for (const day of days) {
      const { puzzle, answer } = engine.createChallenge(day);
      const codes = puzzle.items.map((i) => i.code);
      expect(new Set(codes).size).toBe(SIZE);
      for (const code of codes) expect(pool.has(code)).toBe(true);
      const areas = answer.order.map((c) => answer.areas[c]);
      for (let i = 1; i < areas.length; i++) expect(areas[i - 1] / areas[i]).toBeGreaterThanOrEqual(MIN_RATIO);
    }
  });

  it("o puzzle não traz a área nem a ordem certa", () => {
    let sameAsAnswer = 0;
    for (const day of days) {
      const { puzzle, answer } = engine.createChallenge(day);
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

  it("a ordem certa resolve e mostra a área de todos", () => {
    const check = engine.checkGuess(right, answer, []);
    expect(check).toMatchObject({ ok: true, solved: true });
    if (check.ok) {
      expect(check.feedback.marks.every((m) => m === "correct")).toBe(true);
      expect(check.feedback.areas).toEqual(answer.order.map((c) => answer.areas[c]));
    }
  });

  it("marca só as posições certas, sem dizer para onde os outros vão", () => {
    const check = engine.checkGuess(reversed, answer, []);
    expect(check).toMatchObject({ ok: true, solved: false });
    if (check.ok) {
      // Invertida, só o do meio fica no lugar.
      expect(check.feedback.marks).toEqual(["wrong", "wrong", "correct", "wrong", "wrong"]);
      expect(check.feedback.areas.filter((a) => a !== null)).toHaveLength(1);
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

  it("a resposta revelada lista os países com a área, do maior para o menor", () => {
    const text = engine.describeAnswer(answer);
    expect(text.startsWith("1º ")).toBe(true);
    expect(text.split(" · ")).toHaveLength(SIZE);
  });
});

describe("formatArea e compartilhamento", () => {
  it("escreve a área de um jeito curto", () => {
    expect(formatArea(17_098_246)).toBe("17,1 mi km²");
    expect(formatArea(92_212)).toBe("92 mil km²");
    expect(formatArea(316)).toBe("316 km²");
  });

  it("a grade tem uma linha por tentativa, sem nome de país", () => {
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
    expect(ordemShareGrid(play)).toBe("⬛⬛🟩⬛⬛\n🟩🟩🟩🟩🟩");
  });
});
