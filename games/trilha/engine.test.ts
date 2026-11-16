import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import { replayPlay } from "@/lib/plays/replay";
import { formatResult, playCount } from "@/lib/plays/result";
import { gradePlay, scorePlay } from "@/lib/scoring";
import type { Guess } from "../types";
import { BOARDS, engine } from "./engine";
import { HINT, RULES, SIZE, encodeSegment, lockedPath, shareGrid } from "./rules";
import { countSolutions, isSolution, linksOf, lookahead, type Board } from "./solver";
import type { TrilhaAnswer, TrilhaFeedback } from "./types";

const DAY = "2026-11-12";
const TOTAL = SIZE * SIZE;

/** Os trechos certos, de número em número, na ordem. */
function segments(answer: TrilhaAnswer): number[][] {
  const stops = answer.numbers.map((cell) => answer.path.indexOf(cell));
  return stops.slice(1).map((stop, k) => answer.path.slice(stops[k] + 1, stop + 1));
}

function play(answer: TrilhaAnswer, inputs: string[]) {
  const previous: Guess<TrilhaFeedback>[] = [];
  let last;
  for (const input of inputs) {
    last = engine.checkGuess(input, answer, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input, feedback: last.feedback });
  }
  return { previous, last: last! };
}

/**
 * Um trecho de vizinha em vizinha (sem parede, sem casa já usada, sem outro número) da ponta do
 * caminho até o próximo número que passe em `accept`, ou null.
 */
function findSegment(answer: TrilhaAnswer, previous: Guess<TrilhaFeedback>[], accept: (cells: number[]) => boolean): number[] | null {
  const links = linksOf(answer.size, answer.walls);
  const locked = lockedPath(answer.numbers, previous);
  const target = answer.numbers.find((c) => !locked.includes(c))!;
  const cells: number[] = [];
  const go = (from: number): number[] | null => {
    for (const c of links[from]) {
      if (locked.includes(c) || cells.includes(c) || (answer.numbers.includes(c) && c !== target)) continue;
      cells.push(c);
      const found = c === target ? (accept(cells) ? [...cells] : null) : cells.length < 12 ? go(c) : null;
      cells.pop();
      if (found) return found;
    }
    return null;
  };
  return go(locked[locked.length - 1]);
}

/** Um trecho do 1 até o 2 que segue as regras mas não é o da solução. */
function wrongFirstSegment(answer: TrilhaAnswer): number[] {
  const right = encodeSegment(segments(answer)[0]);
  const found = findSegment(answer, [], (cells) => encodeSegment(cells) !== right);
  if (!found) throw new Error("sem trecho errado do 1 ao 2");
  return found;
}

describe("engine Trilha", () => {
  it("tabuleiro do dia determinístico, diferente no dia seguinte, sem a solução no puzzle", () => {
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(addDays(DAY, 1)).puzzle).not.toEqual(engine.createChallenge(DAY).puzzle);
    const { puzzle } = engine.createChallenge(DAY);
    expect(puzzle.size).toBe(SIZE);
    expect(Object.keys(puzzle).sort()).toEqual(["numbers", "size", "walls"]);
  });

  it("trechos certos travam o caminho e o último resolve; a partida refeita dá o mesmo", () => {
    const { answer } = engine.createChallenge(DAY);
    const inputs = segments(answer).map(encodeSegment);
    const { previous, last } = play(answer, inputs);
    expect(last).toMatchObject({ ok: true, solved: true });
    expect(lockedPath(answer.numbers, previous)).toEqual(answer.path);
    expect(previous.slice(0, -1).every((g) => g.feedback.correct)).toBe(true);

    const replay = replayPlay(engine, RULES, answer, inputs, false);
    expect(replay).toMatchObject({ ok: true, status: "won", count: 0 });
    expect(playCount(RULES, previous)).toBe(0);
    expect(formatResult(RULES, "won", 0)).toBe("Sem erros");
    expect(gradePlay(RULES, "won", 0)).toBe(100);
    expect(scorePlay(RULES, "won", 1)).toBe(2);
  });

  it("trecho errado custa vida e não mexe no caminho; desistir perde", () => {
    const { answer } = engine.createChallenge(DAY);
    const wrong = encodeSegment(wrongFirstSegment(answer));
    const first = engine.checkGuess(wrong, answer, []);
    expect(first).toMatchObject({ ok: true, solved: false, feedback: { correct: false } });
    const { previous } = play(answer, [wrong]);
    expect(lockedPath(answer.numbers, previous)).toEqual([answer.numbers[0]]);
    // O mesmo trecho errado de novo é recusado sem gastar vida.
    expect(engine.checkGuess(wrong, answer, previous)).toMatchObject({ ok: false });

    // Desistir depois de um erro perde.
    const right = encodeSegment(segments(answer)[0]);
    expect(replayPlay(engine, RULES, answer, [wrong, right], true)).toMatchObject({ ok: true, status: "lost", count: 1 });
    expect(formatResult(RULES, "lost", 1)).toBe("X");
  });

  it("três trechos errados acabam com as vidas", () => {
    // Acha um dia em que há pelo menos três jeitos errados de ir do 1 ao 2 (perto de um canto pode
    // haver menos).
    for (let d = 0; d < 60; d++) {
      const { answer } = engine.createChallenge(addDays(DAY, d));
      const right = encodeSegment(segments(answer)[0]);
      const tried: string[] = [];
      while (tried.length < RULES.lives) {
        const other = findSegment(answer, [], (cells) => ![right, ...tried].includes(encodeSegment(cells)));
        if (!other) break;
        tried.push(encodeSegment(other));
      }
      if (tried.length < RULES.lives) continue;
      expect(replayPlay(engine, RULES, answer, tried, false)).toMatchObject({ ok: true, status: "lost", count: 3 });
      expect(replayPlay(engine, RULES, answer, [...tried, right], false)).toMatchObject({ ok: false });
      return;
    }
    throw new Error("nenhum dia com três trechos errados do 1 ao 2");
  });

  it("recusa, sem gastar vida, trecho que não segue as regras", () => {
    const { answer } = engine.createChallenge(DAY);
    const [start] = answer.numbers;
    const [right, after] = segments(answer);
    const refuse = (input: string) => expect(engine.checkGuess(input, answer, [])).toMatchObject({ ok: false });

    refuse("");
    refuse("abc");
    refuse(String(TOTAL));
    refuse(encodeSegment(right.slice(0, -1))); // não chega no próximo número
    refuse(encodeSegment([start, ...right])); // volta pela casa do 1
    refuse(encodeSegment(right.slice(1))); // pula a primeira casa: não sai da ponta
    refuse(encodeSegment([...right, ...after])); // passa do número sem conferir
    refuse(String(answer.numbers[2])); // número fora de ordem
  });

  it("recusa chegar no último número antes de passar por todas as casas", () => {
    // Acha um dia em que dá para ir do penúltimo ao último número por um atalho.
    for (let d = 0; d < 60; d++) {
      const { answer } = engine.createChallenge(addDays(DAY, d));
      const all = segments(answer);
      const { previous } = play(answer, all.slice(0, -1).map(encodeSegment));
      const last = all[all.length - 1];
      const shortcut = findSegment(answer, previous, (cells) => cells.length < last.length);
      if (!shortcut) continue;
      expect(engine.checkGuess(encodeSegment(shortcut), answer, previous)).toMatchObject({ ok: false });
      expect(engine.checkGuess(encodeSegment(last), answer, previous)).toMatchObject({ ok: true, solved: true });
      return;
    }
    throw new Error("nenhum dia com atalho até o último número");
  });

  it("recusa trecho que atravessa uma parede", () => {
    // 3×3 com o 1 no canto, o 2 no meio e o 3 no outro canto. Sem parede, ir do 1 ao 2 por baixo
    // segue as regras (e erra); com a parede entre o 1 e a casa de baixo, nem vale como tentativa.
    const open: TrilhaAnswer = { size: 3, numbers: [0, 4, 8], walls: [], path: [0, 1, 2, 5, 4, 3, 6, 7, 8] };
    const walled: TrilhaAnswer = { ...open, walls: [[0, 3]] };
    expect(engine.checkGuess("3,4", open, [])).toMatchObject({ ok: true, feedback: { correct: false } });
    expect(engine.checkGuess("3,4", walled, [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("1,2,5,4", walled, [])).toMatchObject({ ok: true, feedback: { correct: true } });
  });

  it("até 3 dicas, cada uma revela o próximo trecho certo", () => {
    const { answer } = engine.createChallenge(DAY);
    const { previous } = play(answer, [HINT, HINT, HINT]);
    expect(previous.map((g) => g.feedback.cells)).toEqual(segments(answer).slice(0, 3));
    expect(previous.every((g) => g.feedback.correct && g.feedback.hint)).toBe(true);
    expect(engine.checkGuess(HINT, answer, previous)).toMatchObject({ ok: false });
    const view = { slug: "trilha", dateKey: DAY, number: 1, puzzle: { size: SIZE, numbers: [], walls: [] }, guesses: previous, status: "won" as const };
    expect(shareGrid(view)).toBe("❤️❤️❤️\n💡 3 dicas");
  });

  it("a resposta revelada no fim é o caminho inteiro", () => {
    const { answer } = engine.createChallenge(DAY);
    expect(engine.describeAnswer(answer)).toBe(encodeSegment(answer.path));
  });
});

describe("tabuleiros da Trilha", () => {
  it("400 tabuleiros diferentes, todos 7×7", () => {
    expect(BOARDS.length).toBeGreaterThanOrEqual(400);
    expect(new Set(BOARDS.map((b) => JSON.stringify([b.numbers, b.walls]))).size).toBe(BOARDS.length);
    for (const b of BOARDS) expect(b.path).toHaveLength(TOTAL);
  });

  it("solução válida, única e que sai trecho a trecho sem chute", () => {
    for (const { numbers, walls, path } of BOARDS) {
      const board: Board = { size: SIZE, numbers, walls };
      expect(isSolution(board, path)).toBe(true);
      expect(countSolutions(board)).toBe(1);
      expect(Math.max(...lookahead(board, path))).toBeLessThanOrEqual(1);
      // Paredes só entre casas vizinhas.
      for (const [a, b] of walls) expect([1, SIZE]).toContain(Math.abs(a - b));
    }
  });

  it("o solucionador conta as soluções e confere caminhos", () => {
    // 3×3 só com o 1 e o fim no canto oposto: o zigue-zague pelas linhas e o pelas colunas valem.
    const rows = [0, 1, 2, 5, 4, 3, 6, 7, 8];
    const loose: Board = { size: 3, numbers: [0, 8], walls: [] };
    expect(countSolutions(loose)).toBe(2);
    // Um número no meio só desempata se um dos dois passar por ele fora de ordem.
    expect(countSolutions({ ...loose, numbers: [0, 2, 8] })).toBe(2);
    const unique: Board = { ...loose, numbers: [0, 2, 6, 8] };
    expect(countSolutions(unique)).toBe(1);
    expect(isSolution(unique, rows)).toBe(true);
    // Nesse tabuleiro todo trecho é forçado: nenhuma alternativa sobrevive.
    expect(lookahead(unique, rows)).toEqual([-1, -1, -1]);
    // Uma parede no caminho das linhas deixa só o das colunas.
    expect(countSolutions({ ...loose, walls: [[0, 1]] })).toBe(1);
    expect(isSolution(loose, [0, 1, 2, 5, 8, 7, 6, 3, 4])).toBe(false);
  });
});
