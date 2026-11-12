import { isDateKey } from "@/lib/daily/date";
import { DAILY_SEED, createRng, shuffle } from "@/lib/daily/seed";
import { countries } from "../_shared/geo";
import tiers from "../bandeira/data/tiers.json";
import type { GameEngine } from "../types";
import { SEPARATOR, SIZE, encodeOrder, formatArea } from "./rules";
import type { OrdemAnswer, OrdemFeedback, OrdemMark, OrdemPuzzle } from "./types";

/**
 * Os países que entram: os dos dois primeiros níveis da Bandeira (os mais conhecidos), para o
 * desafio ser sobre o tamanho e não sobre achar o país no mapa.
 */
export const POOL = countries.filter((c) => tiers["1"].includes(c.code) || tiers["2"].includes(c.code));

/**
 * Dois países do dia precisam ter áreas a pelo menos 20% de distância: com 3% de diferença, a
 * ordem vira loteria.
 */
export const MIN_RATIO = 1.2;

const farEnough = (a: number, b: number) => Math.max(a, b) / Math.min(a, b) >= MIN_RATIO;

export const engine: GameEngine<OrdemPuzzle, OrdemAnswer, OrdemFeedback> = {
  createChallenge(dateKey) {
    if (!isDateKey(dateKey)) throw new Error(`data inválida: ${dateKey}`);
    // Embaralha os países com a seed do dia e vai pegando os que não ficam perto demais dos já
    // escolhidos. Determinístico: mesma data e mesmo segredo, mesmos países.
    const rng = createRng(`${DAILY_SEED}:ordem:${dateKey}`);
    const picked: typeof POOL = [];
    for (const country of shuffle(POOL, rng)) {
      if (picked.every((p) => farEnough(p.areaKm2, country.areaKm2))) picked.push(country);
      if (picked.length === SIZE) break;
    }
    if (picked.length < SIZE) throw new Error(`ordem: não achei ${SIZE} países para ${dateKey}`);

    const order = [...picked].sort((a, b) => b.areaKm2 - a.areaKm2).map((c) => c.code);
    return {
      // A ordem mostrada sai do mesmo sorteio: não tem relação com o tamanho.
      puzzle: { items: shuffle(picked, rng).map(({ code, name }) => ({ code, name })) },
      answer: { order, areas: Object.fromEntries(picked.map((c) => [c.code, c.areaKm2])) },
    };
  },

  checkGuess(input, answer, previous) {
    const codes = input.split(SEPARATOR).map((c) => c.trim());
    const expected = new Set(answer.order);
    if (codes.length !== SIZE || new Set(codes).size !== SIZE || !codes.every((c) => expected.has(c))) {
      return { ok: false, error: "Ordene os 5 países antes de confirmar" };
    }
    if (previous.some((g) => encodeOrder(g.feedback.order) === encodeOrder(codes))) {
      return { ok: false, error: "Você já tentou essa ordem" };
    }
    const marks: OrdemMark[] = codes.map((code, i) => (answer.order[i] === code ? "correct" : "wrong"));
    return {
      ok: true,
      solved: marks.every((m) => m === "correct"),
      feedback: { order: codes, marks, areas: codes.map((c, i) => (marks[i] === "correct" ? answer.areas[c] : null)) },
    };
  },

  describeAnswer: (answer) =>
    answer.order
      .map((code, i) => `${i + 1}º ${countries.find((c) => c.code === code)?.name ?? code} (${formatArea(answer.areas[code])})`)
      .join(" · "),
};
