import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import type { Guess } from "../../types";
import { engine as dupla } from "../../dupla/engine";
import { engine as quadra } from "../../quadra/engine";
import { engine as palavra } from "../../palavra/engine";
import { solvedBoards } from "./engine";
import type { MultiWordFeedback } from "./types";

const play = (eng: typeof dupla, answer: string[], words: string[]) => {
  const previous: Guess<MultiWordFeedback>[] = [];
  let last;
  for (const w of words) {
    last = eng.checkGuess(w, answer, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input: w, feedback: last.feedback });
  }
  return { last: last!, previous };
};

describe("Dupla e Quadra", () => {
  it("palavras do dia determinísticas, todas diferentes, e diferentes do Palavra", () => {
    for (let i = 0; i < 40; i++) {
      const day = addDays("2026-10-22", i);
      const d = dupla.createChallenge(day);
      const q = quadra.createChallenge(day);
      expect(dupla.createChallenge(day)).toEqual(d);
      expect(new Set(d.answer).size).toBe(2);
      expect(new Set(q.answer).size).toBe(4);
      expect(d.puzzle).toEqual({ length: 5, boards: 2 });
      expect(JSON.stringify(q.puzzle)).not.toContain(q.answer[0]);
    }
    expect(dupla.createChallenge("2026-10-22").answer).not.toContain(palavra.createChallenge("2026-10-22").answer);
  });

  it("cada tentativa vale para todos os tabuleiros abertos", () => {
    const { last } = play(dupla, ["carro", "pedra"], ["corda"]);
    expect(last).toMatchObject({ ok: true, solved: false });
    if (!last.ok) return;
    expect(last.feedback.boards).toHaveLength(2);
    expect(last.feedback.boards.every((b) => b?.length === 5)).toBe(true);
  });

  it("tabuleiro resolvido para de receber tentativas; ganha quando todos saem", () => {
    const { previous, last } = play(dupla, ["carro", "pedra"], ["carro", "nuvem"]);
    expect(previous[1].feedback.boards[0]).toBeNull();
    expect(previous[1].feedback.boards[1]).not.toBeNull();
    expect(last).toMatchObject({ solved: false });
    expect(solvedBoards(previous, 2)).toEqual([true, false]);
    const done = play(dupla, ["carro", "pedra"], ["carro", "nuvem", "pedra"]);
    expect(done.last).toMatchObject({ ok: true, solved: true });
  });

  it("mesma validação do Palavra: tamanho, dicionário e repetição", () => {
    expect(dupla.checkGuess("casa", ["carro", "pedra"], [])).toMatchObject({ ok: false });
    expect(dupla.checkGuess("xxxxx", ["carro", "pedra"], [])).toMatchObject({ ok: false });
    const { previous } = play(dupla, ["carro", "pedra"], ["nuvem"]);
    expect(dupla.checkGuess("NUVEM", ["carro", "pedra"], previous)).toMatchObject({ ok: false });
  });

  it("revela todas as palavras no fim", () => {
    expect(quadra.describeAnswer(["carro", "pedra", "nuvem", "festa"])).toBe("CARRO · PEDRA · NUVEM · FESTA");
  });
});
