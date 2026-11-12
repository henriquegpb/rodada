import { isDateKey } from "@/lib/daily/date";
import { DAILY_SEED, createRng, pickDaily, shuffle } from "@/lib/daily/seed";
import { countries, type Country } from "../_shared/geo";
import tiers from "../bandeira/data/tiers.json";
import type { GameEngine } from "../types";
import stats from "./data/stats.json";
import { CATEGORIES, CATEGORY_IDS, SEPARATOR, SIZE, encodeOrder } from "./rules";
import type { OrdemAnswer, OrdemCategory, OrdemFeedback, OrdemMark, OrdemPuzzle } from "./types";

/**
 * Os países que entram: os dos dois primeiros níveis da Bandeira (os mais conhecidos), para o
 * desafio ser sobre o número e não sobre achar o país no mapa.
 */
export const POOL = countries.filter((c) => tiers["1"].includes(c.code) || tiers["2"].includes(c.code));

type Stats = { population: number; gdp: number; gdpPerCapita: number; lifeExpectancy: number };
const STATS = stats as Record<string, Stats>;

/** O número do país na categoria; undefined quando o Banco Mundial não tem (Taiwan, Coreia do Norte). */
export function valueOf(country: Country, category: OrdemCategory): number | undefined {
  if (category === "area") return country.areaKm2;
  const s = STATS[country.code];
  if (!s) return undefined;
  if (category === "density") return s.population / country.areaKm2;
  return s[category];
}

/**
 * Dois países do dia precisam ficar longe um do outro: com 3% de diferença, a ordem vira loteria.
 * Na maioria das categorias, 20% de distância; na expectativa de vida, que vai só de uns 55 a 85
 * anos, 2,5 anos.
 */
export const MIN_RATIO = 1.2;
export const MIN_YEARS = 2.5;

export function farEnough(category: OrdemCategory, a: number, b: number): boolean {
  if (category === "lifeExpectancy") return Math.abs(a - b) >= MIN_YEARS;
  return Math.max(a, b) / Math.min(a, b) >= MIN_RATIO;
}

/** A categoria do dia: passa por todas antes de repetir. */
export const categoryOf = (dateKey: string): OrdemCategory => pickDaily(CATEGORY_IDS, { slug: "ordem:categoria", dateKey });

export const engine: GameEngine<OrdemPuzzle, OrdemAnswer, OrdemFeedback> = {
  createChallenge(dateKey) {
    if (!isDateKey(dateKey)) throw new Error(`data inválida: ${dateKey}`);
    const category = categoryOf(dateKey);
    // Embaralha os países com a seed do dia e vai pegando os que não ficam perto demais dos já
    // escolhidos. Determinístico: mesma data e mesmo segredo, mesmos países.
    const rng = createRng(`${DAILY_SEED}:ordem:${dateKey}`);
    const picked: { country: Country; value: number }[] = [];
    for (const country of shuffle(POOL, rng)) {
      const value = valueOf(country, category);
      if (value === undefined) continue;
      if (picked.every((p) => farEnough(category, p.value, value))) picked.push({ country, value });
      if (picked.length === SIZE) break;
    }
    if (picked.length < SIZE) throw new Error(`ordem: não achei ${SIZE} países para ${dateKey}`);

    const order = [...picked].sort((a, b) => b.value - a.value).map((p) => p.country.code);
    return {
      // A ordem mostrada sai do mesmo sorteio: não tem relação com o número.
      puzzle: { category, items: shuffle(picked, rng).map(({ country: { code, name } }) => ({ code, name })) },
      answer: { category, order, values: Object.fromEntries(picked.map((p) => [p.country.code, p.value])) },
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
      feedback: { order: codes, marks, values: codes.map((c, i) => (marks[i] === "correct" ? answer.values[c] : null)) },
    };
  },

  describeAnswer: (answer) => {
    const { label, format } = CATEGORIES[answer.category];
    const list = answer.order
      .map((code, i) => `${i + 1}º ${countries.find((c) => c.code === code)?.name ?? code} (${format(answer.values[code])})`)
      .join(" · ");
    return `${label}: ${list}`;
  },
};
