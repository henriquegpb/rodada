import { EPOCH_DATE } from "@/lib/daily/date";
import { pickDailyMany } from "@/lib/daily/seed";
import type { GameEngine, PublicFileReader } from "../types";
import index from "./data/index.json";
import { NOT_IN_LIST, allWords, answerKey, editDistance, nameWords, suggestionMessage, typoBudget } from "./match";
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

/**
 * As categorias do sorteio no dia: as novas só a partir da estreia, e os dias passados não mudam.
 * Antes do Rodada existir só há treino ("Jogar outra"), que usa a lista inteira.
 */
export const poolOn = (dateKey: string) =>
  CATEGORIES.filter((c) => !c.since || c.since <= dateKey || dateKey < EPOCH_DATE);

/**
 * As respostas que valiam num dia: a versão atual a partir do `from` dela; antes, a anterior que
 * valia então. Assim a lista cresce sem mudar a partida de quem jogou num dia que já passou.
 */
export function versionOn(ref: IncomumCategoryRef, dateKey: string): IncomumCategoryRef {
  if (!ref.from || ref.from <= dateKey || dateKey < EPOCH_DATE) return ref;
  const old = ref.previous?.findLast((p) => !p.from || p.from <= dateKey);
  return old ? { ...ref, ...old, archived: true } : ref;
}

/** Onde estão as respostas de uma versão: a atual em incomum/<id>.json, as anteriores em incomum/v/. */
const fileOf = (ref: IncomumCategoryRef) =>
  ref.archived ? `incomum/v/${ref.id}.${ref.v}.json` : `incomum/${ref.id}.json?v=${ref.v}`;

// ---------- respostas, baixadas só para as categorias do dia ----------

const loaded = new Map<string, IncomumItems>();
const loading = new Map<string, Promise<void>>();

/**
 * Carrega as respostas da categoria (uma vez só; se falhar, tenta de novo na próxima). O arquivo
 * fica em public/incomum/; `read` baixa no navegador e lê do disco no servidor.
 */
export function loadCategory(ref: IncomumCategoryRef, read: PublicFileReader): Promise<void> {
  const key = `${ref.id}@${ref.v}`;
  if (loaded.has(key)) return Promise.resolve();
  let pending = loading.get(key);
  if (!pending) {
    pending = read(fileOf(ref)).then(
      (items) => {
        loaded.set(key, items as IncomumItems);
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

/** As respostas da categoria, se já foram carregadas (veja `loadCategory`). */
export const itemsOf = (ref: IncomumCategoryRef): IncomumItems | undefined => loaded.get(`${ref.id}@${ref.v}`);

// ---------- encontrar a resposta ----------

interface Index {
  /** Chave de cada nome aceito → posição da resposta. Num empate de chave, fica a mais óbvia. */
  exact: Map<string, number>;
  /** Para sugerir: a chave, a posição da resposta e o nome como está na lista. */
  keys: [key: string, item: number, name: string][];
  /** Cada palavra de um nome de várias palavras → as respostas que a têm, da mais óbvia à mais rara. */
  words: Map<string, number[]>;
}

const indexes = new WeakMap<IncomumItems, Index>();

function indexOf(items: IncomumItems): Index {
  let found = indexes.get(items);
  if (!found) {
    const exact = new Map<string, number>();
    const keys: Index["keys"] = [];
    const words: Index["words"] = new Map();
    items.forEach((names, i) => {
      for (const name of names) {
        const key = answerKey(name);
        if (!key || exact.has(key)) continue;
        exact.set(key, i);
        keys.push([key, i, name]);
      }
      // Pela metade só nome de várias palavras: "Cocielo" acha "Júlio Cocielo".
      for (const name of names) {
        if (name.trim().split(/\s+/).length < 2) continue;
        for (const word of nameWords(name)) {
          const list = words.get(word) ?? [];
          if (list[list.length - 1] !== i) list.push(i);
          words.set(word, list);
        }
      }
    });
    found = { exact, keys, words };
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
  // Palavras inteiras do nome valem mais que um nome inteiro com letras trocadas ("Leonardo").
  const part = partOfName(items, input);
  if (part) return part;
  const budget = typoBudget(key);
  if (!budget) return null;
  let best: Match | null = null;
  let bestDistance = Infinity;
  for (const [candidate, item] of keys) {
    // Vale o limite menor dos dois: nome curto da lista ("CWB") não vira sugestão de "cwa".
    const allowed = Math.min(budget, typoBudget(candidate));
    if (!allowed) continue;
    const d = editDistance(key, candidate, allowed);
    if (d > allowed) continue;
    if (d < bestDistance || (d === bestDistance && best && item < best.item)) {
      // Sugere o nome principal ("Pablo Picasso"), não o apelido parecido ("P. Picasso").
      best = { item, name: items[item][0], exact: false };
      bestDistance = d;
    }
  }
  return best;
}

/**
 * Parte de um nome da lista ("Cocielo", "Da Vinci"): todas as palavras digitadas estão num mesmo
 * nome. Sugere a resposta mais óbvia assim, que a pessoa confirma. No nome da tela vale qualquer
 * pedaço. Num apelido, só palavra que quase só aquele item tem e que seja pelo menos metade dele:
 * "philosopher" está em "Laughing Philosopher" (Demócrito) e em mais quatro, não é nome de ninguém.
 */
function partOfName(items: IncomumItems, input: string): Match | null {
  const typed = nameWords(input);
  if (!typed.length) return null;
  const every = allWords(input);
  const { words } = indexOf(items);
  // Em quantas respostas está a palavra digitada mais rara: nome, ou palavra comum a várias.
  const shared = Math.min(...typed.map((w) => words.get(w)?.length ?? 0));
  for (const item of words.get(typed[0]) ?? []) {
    const fits = items[item].some((name, n) => {
      const own = allWords(name);
      if (own.length < every.length || !every.every((w) => own.includes(w))) return false;
      return n === 0 || (shared <= 2 && every.length * 2 >= own.length);
    });
    if (fits) return { item, name: items[item][0], exact: false };
  }
  return null;
}

function createChallenge(dateKey: string) {
  const categories = pickDailyMany(poolOn(dateKey), ROUND, {
    slug: "incomum",
    dateKey,
  }).map((c) => versionOn(c, dateKey));
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
  async prepare(dateKey, read) {
    await Promise.all(createChallenge(dateKey).answer.categories.map((ref) => loadCategory(ref, read)));
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
    if (!match) return { ok: false, error: NOT_IN_LIST };
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
