import { pickDaily } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import boards from "./data/boards.json";
import { HINT, HINTS, SEPARATOR, SIZE, encodeSegment, lockedPath, nextNumber } from "./rules";
import { linksOf, type Wall } from "./solver";
import type { TrilhaAnswer, TrilhaFeedback, TrilhaPuzzle } from "./types";

/** Um tabuleiro gerado em scripts/build-trilha.ts. */
interface TrilhaBoard {
  numbers: number[];
  walls: Wall[];
  /** A solução, que é única: o caminho inteiro, do 1 até o último número. */
  path: number[];
}

/** O JSON traz cada parede como uma lista; aqui ela vira o par de casas. */
export const BOARDS: TrilhaBoard[] = boards.map((b) => ({ ...b, walls: b.walls.map(([a, c]) => [a, c] as const) }));

/**
 * Engine da Trilha: o tabuleiro do dia e a conferência de cada trecho contra a solução. O caminho
 * certo até aqui é sempre um começo da solução, então o próximo trecho certo é o pedaço dela que vai
 * da ponta até o próximo número.
 */
export const engine: GameEngine<TrilhaPuzzle, TrilhaAnswer, TrilhaFeedback> = {
  createChallenge(dateKey) {
    const { numbers, walls, path } = pickDaily(BOARDS, { slug: "trilha", dateKey });
    return { puzzle: { size: SIZE, numbers, walls }, answer: { size: SIZE, numbers, walls, path } };
  },

  checkGuess(input, answer, previous) {
    const { size, numbers, walls, path } = answer;
    const total = size * size;
    const locked = lockedPath(numbers, previous);
    const k = nextNumber(numbers, locked);
    if (k === -1) return { ok: false, error: "O caminho já está completo" };
    const target = numbers[k];
    const expected = path.slice(locked.length, path.indexOf(target) + 1);

    if (input === HINT) {
      if (previous.filter((g) => g.feedback.hint).length >= HINTS) return { ok: false, error: "Acabaram as dicas" };
      return { ok: true, solved: locked.length + expected.length === total, feedback: { cells: expected, correct: true, hint: true } };
    }

    // O tabuleiro só deixa mandar trechos que seguem as regras; o resto é tentativa adulterada.
    const cells = input.split(SEPARATOR).map(Number);
    const links = linksOf(size, walls);
    const taken = new Set(locked);
    const valid =
      cells.length > 0 &&
      cells.every((c, i) => {
        if (!Number.isInteger(c) || taken.has(c)) return false;
        taken.add(c);
        return links[i === 0 ? locked[locked.length - 1] : cells[i - 1]].includes(c);
      }) &&
      cells[cells.length - 1] === target &&
      cells.slice(0, -1).every((c) => !numbers.includes(c));
    if (!valid) return { ok: false, error: "Esse trecho não segue as regras" };
    if (k === numbers.length - 1 && locked.length + cells.length !== total) {
      return { ok: false, error: "Passe por todas as casas antes do último número" };
    }
    const segment = encodeSegment(cells);
    if (previous.some((g) => !g.feedback.correct && encodeSegment(g.feedback.cells) === segment)) {
      return { ok: false, error: "Você já tentou esse trecho" };
    }

    const correct = segment === encodeSegment(expected);
    return { ok: true, solved: correct && locked.length + cells.length === total, feedback: { cells, correct } };
  },

  // O tabuleiro mostra a solução no fim; não há uma resposta em texto.
  describeAnswer: (answer) => encodeSegment(answer.path),
};
