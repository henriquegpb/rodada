import { createRng, DAILY_SEED, pickDaily, shuffle } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import type { GameEngine } from "../types";
import data from "./data/puzzles.json";
import { formatGroups, GUESS_SEPARATOR } from "./text";
import type { EloFeedback, EloGroup, EloPuzzle } from "./types";

export const GROUP_SIZE = 4;

/**
 * Desafios curados: 4 grupos de 4 palavras, do nível 0 (fácil) ao 3 (trocadilho). Os que têm
 * `source` foram montados com grupos traduzidos do Only Connect Wall (os ids dos grupos originais).
 */
export const puzzles = data as { groups: EloGroup[] }[];

export const engine: GameEngine<EloPuzzle, EloGroup[], EloFeedback> = {
  createChallenge(dateKey) {
    const { groups } = pickDaily(puzzles, { slug: "elo", dateKey });
    // A grade também sai embaralhada pela seed: a ordem do arquivo entregaria os grupos.
    const words = shuffle(
      groups.flatMap((g) => g.words),
      createRng(`${DAILY_SEED}:elo:${dateKey}:grade`),
    );
    return { puzzle: { words }, answer: groups };
  },

  checkGuess(input, answer, previous) {
    const picked = input.split(GUESS_SEPARATOR).map(normalize).filter(Boolean);
    if (picked.length !== GROUP_SIZE) return { ok: false, error: "Escolha 4 palavras" };
    if (new Set(picked).size !== GROUP_SIZE) return { ok: false, error: "Escolha 4 palavras diferentes" };

    const spelling = new Map(answer.flatMap((g) => g.words).map((w) => [normalize(w), w]));
    if (picked.some((w) => !spelling.has(w))) return { ok: false, error: "Essa palavra não está no jogo" };

    const found = previous.flatMap((g) => (g.feedback.group ? [g.feedback.group] : []));
    const taken = new Set(found.flatMap((g) => g.words).map(normalize));
    if (picked.some((w) => taken.has(w))) return { ok: false, error: "Essa palavra já está num grupo" };

    const key = [...picked].sort().join();
    if (previous.some((g) => g.feedback.words.map(normalize).sort().join() === key)) {
      return { ok: false, error: "Você já tentou esse grupo" };
    }

    const hits = (g: EloGroup) => g.words.filter((w) => picked.includes(normalize(w))).length;
    const group = answer.find((g) => hits(g) === GROUP_SIZE) ?? null;
    const feedback: EloFeedback = {
      words: picked.map((w) => spelling.get(w)!),
      group,
      oneAway: !group && answer.some((g) => hits(g) === GROUP_SIZE - 1),
    };

    // Até o último grupo é enviado pela pessoa: a partida só acaba com os 4 achados.
    const solved = group !== null && found.length + 1 === answer.length;
    return { ok: true, feedback, solved };
  },

  describeAnswer: formatGroups,
};
