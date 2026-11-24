import { pickDailyMany } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import index from "./data/index.json";
import { answerKey, editDistance, suggestionMessage, typoBudget } from "./match";
import { ROUND, SKIP, TIERS, TIMEOUT, tierOf } from "./tiers";
import type { IncomumCategoryRef, IncomumFeedback, IncomumPuzzle } from "./types";

/**
 * As respostas de uma categoria, da mais óbvia à mais rara. Cada uma é [nome na tela, ...outros
 * nomes que valem]: apelidos, grafias, nome em inglês. Gerado por scripts/build-incomum.ts.
 */
export type IncomumItems = readonly (readonly string[])[];

export interface IncomumAnswer {
  categories: IncomumCategoryRef[];
}

/** O índice só tem categorias com respostas suficientes para o sorteio (veja o build). */
export const CATEGORIES: readonly IncomumCategoryRef[] = index;

// ---------- respostas, baixadas só para as categorias do dia ----------

const loaded = new Map<string, IncomumItems>();
const loading = new Map<string, Promise<void>>();

let fetchItems = async (ref: IncomumCategoryRef): Promise<IncomumItems> => {
  const res = await fetch(`/incomum/${ref.id}.json?v=${ref.v}`);
  if (!res.ok) throw new Error(`categoria ${ref.id}: ${res.status}`);
  return res.json();
};

/** Troca de onde vêm as respostas (os testes leem do disco, sem servidor). */
export function setItemsLoader(loader: (ref: IncomumCategoryRef) => Promise<IncomumItems>) {
  fetchItems = loader;
}

/** Baixa as respostas da categoria (uma vez só; se falhar, tenta de novo na próxima). */
export function loadCategory(ref: IncomumCategoryRef): Promise<void> {
  const key = `${ref.id}@${ref.v}`;
  if (loaded.has(key)) return Promise.resolve();
  let pending = loading.get(key);
  if (!pending) {
    pending = fetchItems(ref).then(
      (items) => {
        loaded.set(key, items);
      },
      (err) => {
        // Rede caiu: a próxima tentativa baixa de novo.
        loading.delete(key);
        throw err;
      },
    );
    loading.set(key, pending);
  }
  return pending;
}

const itemsOf = (ref: IncomumCategoryRef) => loaded.get(`${ref.id}@${ref.v}`);

// ---------- encontrar a resposta ----------

interface Index {
  /** Chave de cada nome aceito → posição da resposta. Num empate de chave, fica a mais óbvia. */
  exact: Map<string, number>;
  /** Para sugerir: a chave, a posição da resposta e o nome como está na lista. */
  keys: [key: string, item: number, name: string][];
}

const indexes = new WeakMap<IncomumItems, Index>();

function indexOf(items: IncomumItems): Index {
  let found = indexes.get(items);
  if (!found) {
    const exact = new Map<string, number>();
    const keys: Index["keys"] = [];
    items.forEach((names, i) => {
      for (const name of names) {
        const key = answerKey(name);
        if (!key || exact.has(key)) continue;
        exact.set(key, i);
        keys.push([key, i, name]);
      }
    });
    found = { exact, keys };
    indexes.set(items, found);
  }
  return found;
}

/** O que a pessoa digitou na lista: a posição, o nome achado e se foi exato ou só parecido. */
export interface Match {
  item: number;
  name: string;
  exact: boolean;
}

/**
 * Procura a resposta digitada. Exata quando a chave bate (acento, maiúscula, hífen e artigo não
 * contam); senão, o nome mais parecido com até `typoBudget` letras erradas, para sugerir
 * ("homem araanha" → "Homem-Aranha"). Num empate de distância, a mais óbvia.
 */
export function findAnswer(items: IncomumItems, input: string): Match | null {
  const key = answerKey(input);
  if (key.length < 2) return null;
  const { exact, keys } = indexOf(items);
  const hit = exact.get(key);
  if (hit !== undefined) return { item: hit, name: items[hit][0], exact: true };
  const budget = typoBudget(key);
  if (!budget) return null;
  let best: Match | null = null;
  let bestDistance = Infinity;
  for (const [candidate, item, name] of keys) {
    // Vale o limite menor dos dois: nome curto da lista ("CWB") não vira sugestão de "cwa".
    const allowed = Math.min(budget, typoBudget(candidate));
    if (!allowed) continue;
    const d = editDistance(key, candidate, allowed);
    if (d > allowed) continue;
    if (d < bestDistance || (d === bestDistance && best && item < best.item)) {
      best = { item, name, exact: false };
      bestDistance = d;
    }
  }
  return best;
}

function createChallenge(dateKey: string) {
  const categories = pickDailyMany(CATEGORIES, ROUND, {
    slug: "incomum",
    dateKey,
  });
  return {
    puzzle: {
      categories: categories.map((c) => ({ title: c.title, total: c.total })),
    },
    answer: { categories },
  };
}

export const engine: GameEngine<IncomumPuzzle, IncomumAnswer, IncomumFeedback> = {
  createChallenge,

  // As 7 categorias do dia, baixadas antes da partida abrir (umas dezenas de KB cada).
  async prepare(dateKey) {
    await Promise.all(createChallenge(dateKey).answer.categories.map(loadCategory));
  },

  isReady: (dateKey) => createChallenge(dateKey).answer.categories.every((c) => itemsOf(c)),

  checkGuess(input, answer, previous) {
    const category = answer.categories[previous.length];
    if (!category) return { ok: false, error: "Você já respondeu todas as categorias" };
    const solved = previous.length === answer.categories.length - 1;
    const { obvious, total } = category;
    if (input === SKIP || input === TIMEOUT) {
      const missed = input === SKIP ? "skip" : "time";
      return {
        ok: true,
        solved,
        feedback: {
          answer: null,
          tier: -1,
          points: 0,
          rank: 0,
          obvious,
          missed,
          total,
        },
      };
    }
    const items = itemsOf(category);
    if (!items)
      return {
        ok: false,
        error: "Ainda carregando as respostas. Tenta de novo em um segundo!",
      };
    const match = findAnswer(items, input);
    if (!match) return { ok: false, error: "Essa não está na lista. Tenta outra!" };
    // Parecido não vale sozinho: a pessoa confirma a sugestão, que aí bate exato.
    if (!match.exact) return { ok: false, error: suggestionMessage(match.name) };
    const index = match.item;
    const tier = tierOf(index, total);
    return {
      ok: true,
      solved,
      feedback: {
        answer: items[index][0],
        tier,
        points: TIERS[tier].points,
        rank: index + 1,
        obvious,
        total,
      },
    };
  },

  // Uma linha por categoria: as raríssimas mais conhecidas, para mostrar no fim o que dava para ter dito.
  describeAnswer: (answer) => answer.categories.map((c) => c.rare.join(", ")).join("\n"),

  maxPoints: () => ROUND * TIERS[TIERS.length - 1].points,
};
