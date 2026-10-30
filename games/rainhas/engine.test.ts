import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { formatResult, playCount } from "@/lib/plays/result";
import { scorePlay } from "@/lib/scoring";
import type { Guess } from "../types";
import { engine as engine10 } from "../rainhas-10/engine";
import { engine as engine9 } from "../rainhas-9/engine";
import boards10 from "./data/10.json";
import boards8 from "./data/8.json";
import boards9 from "./data/9.json";
import { engine } from "./engine";
import { HINT, RULES, shareGrid } from "./rules";
import { conflicts, otherSolution, solveByLogic } from "./solver";
import type { RainhasFeedback } from "./types";

const DAY = "2026-10-29";
const regionsOf = (text: string) => [...text].map((c) => c.charCodeAt(0) - 97);

function play(queens: number[], inputs: string[]) {
  const previous: Guess<RainhasFeedback>[] = [];
  let last;
  for (const input of inputs) {
    last = engine.checkGuess(input, queens, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input, feedback: last.feedback });
  }
  return { previous, last: last! };
}

describe("engine Rainhas", () => {
  it("tabuleiro do dia determinístico, diferente no dia seguinte e em cada tamanho", () => {
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(addDays(DAY, 1)).puzzle).not.toEqual(engine.createChallenge(DAY).puzzle);
    expect(engine.createChallenge(DAY).puzzle.size).toBe(8);
    expect(engine9.createChallenge(DAY).puzzle.size).toBe(9);
    expect(engine10.createChallenge(DAY).puzzle.size).toBe(10);
  });

  it("rainha certa conta; errada custa vida; todas certas resolvem", () => {
    const { answer: queens } = engine.createChallenge(DAY);
    const cells = queens.map((c, row) => row * 8 + c);
    const wrongCell = queens[0] === 0 ? 1 : 0;
    expect(engine.checkGuess(String(wrongCell), queens, [])).toMatchObject({ ok: true, solved: false, feedback: { correct: false } });
    const { last, previous } = play(queens, cells.map(String));
    expect(last).toMatchObject({ ok: true, solved: true });
    expect(playCount(RULES, previous)).toBe(0);
    expect(formatResult(RULES, "won", 0)).toBe("Sem erros");
    expect(formatResult(RULES, "won", 1)).toBe("1 erro");
    expect(formatResult(RULES, "lost", 3)).toBe("X");
    expect(scorePlay(RULES, "won", 1)).toBe(2);
  });

  it("recusa casa inválida ou repetida sem gastar vida", () => {
    const { answer: queens } = engine.createChallenge(DAY);
    expect(engine.checkGuess("64", queens, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("abc", queens, [])).toMatchObject({ ok: false });
    const { previous } = play(queens, [String(queens[0])]);
    expect(engine.checkGuess(String(queens[0]), queens, previous)).toMatchObject({ ok: false });
  });

  it("até 3 dicas, cada uma revela uma rainha certa que ainda não estava no tabuleiro", () => {
    const { answer: queens } = engine.createChallenge(DAY);
    const { previous } = play(queens, [HINT, HINT, HINT]);
    const cells = previous.map((g) => g.feedback.cell);
    expect(new Set(cells).size).toBe(3);
    for (const cell of cells) expect(queens[Math.floor(cell / 8)]).toBe(cell % 8);
    expect(engine.checkGuess(HINT, queens, previous)).toMatchObject({ ok: false });
    expect(shareGrid({ slug: "rainhas", dateKey: DAY, number: 1, puzzle: { size: 8, regions: "" }, guesses: previous, status: "won" })).toContain("💡 3 dicas");
  });
});

describe("tabuleiros das Rainhas", () => {
  it.each([
    [8, boards8],
    [9, boards9],
    [10, boards10],
  ] as const)("%i×%i: solução válida, única e que sai por dedução", (n, boards) => {
    for (const board of boards) {
      const regions = regionsOf(board.regions);
      expect(regions).toHaveLength(n * n);
      expect(new Set(regions).size).toBe(n);
      const cells = board.queens.map((c, row) => row * n + c);
      for (const a of cells) for (const b of cells) expect(conflicts(n, regions, a, b)).toBe(false);
      expect(otherSolution(n, regions, board.queens)).toBeNull();
      expect(solveByLogic(n, regions)).toEqual(board.queens);
    }
  });
});
