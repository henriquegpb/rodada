import { pickDaily } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import type { GameEngine, Guess } from "../types";
import answers from "./data/answers.json";
import near from "./data/near.json";
import data from "./data/words.json";
import { lemmaCandidates } from "./forms";
import { HINT } from "./rank";
import type { SentidoFeedback, SentidoPuzzle } from "./types";

/**
 * Dados gerados em scripts/build-sentido.ts: o vocabulário, vetores reduzidos de cada palavra e,
 * para cada resposta, as palavras mais próximas na ordem exata do modelo completo. O resto da
 * lista sai dos vetores reduzidos, que acertam a ordem de grandeza.
 */
const { words, dims } = data;
const forms: Record<string, string> = data.forms;
const nearest: Record<string, string> = near;
export const ANSWERS: readonly string[] = answers;

/** Primeira dica sem nenhum chute: uma palavra no fim da faixa verde. */
const FIRST_HINT = 300;
/** Daqui para perto, cada dica anda uma posição; antes disso, corta o caminho pela metade. */
const CLOSE = 20;
/**
 * Dicas só com as palavras mais comuns (o vocabulário vem em ordem de frequência). As raras
 * ("fajã", "azenha") continuam valendo como chute, mas como dica não ajudam ninguém.
 */
const HINT_WORDS = 8000;

const index = new Map(words.map((w, i) => [w, i]));

/** Sem acento → lemas possíveis. Mais de um ("coco" e "cocô") pede o acento. */
const byKey = new Map<string, Set<string>>();
function addKey(text: string, lemma: string) {
  const key = normalize(text);
  if (!byKey.has(key)) byKey.set(key, new Set());
  byKey.get(key)!.add(lemma);
}
for (const word of words) addKey(word, word);
for (const [form, lemma] of Object.entries(forms)) addKey(form, lemma);

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const vectors = new Int8Array(decode(data.vectors).buffer);

interface Ranking {
  /** order[k] = índice da palavra na posição k + 1. */
  order: Uint16Array;
  /** rank[i] = posição da palavra de índice i (1 = a resposta). */
  rank: Uint16Array;
}

const rankings = new Map<string, Ranking>();

/** A lista inteira, da resposta à palavra mais distante. Calculada uma vez por resposta. */
function rankingFor(answer: string): Ranking {
  const cached = rankings.get(answer);
  if (cached) return cached;
  const a = index.get(answer)!;
  const top = new Uint16Array(decode(nearest[answer]).buffer);
  const order = new Uint16Array(words.length);
  const rank = new Uint16Array(words.length);
  order[0] = a;
  rank[a] = 1;
  top.forEach((w, k) => {
    order[k + 1] = w;
    rank[w] = k + 2;
  });

  const sims = new Float32Array(words.length);
  const rest: number[] = [];
  for (let w = 0; w < words.length; w++) {
    if (rank[w]) continue;
    let s = 0;
    for (let i = 0; i < dims; i++) s += vectors[a * dims + i] * vectors[w * dims + i];
    sims[w] = s;
    rest.push(w);
  }
  rest.sort((x, y) => sims[y] - sims[x]);
  rest.forEach((w, k) => {
    order[top.length + 1 + k] = w;
    rank[w] = top.length + 2 + k;
  });

  const ranking = { order, rank };
  rankings.set(answer, ranking);
  return ranking;
}

function lookup(text: string): { word: string } | { error: string } | undefined {
  if (index.has(text)) return { word: text };
  if (forms[text]) return { word: forms[text] };
  const options = [...(byKey.get(normalize(text)) ?? [])];
  if (options.length === 1) return { word: options[0] };
  if (options.length > 1) {
    const list = options.join(" ou ");
    return { error: `${list[0].toUpperCase()}${list.slice(1)}? Escreva com acento.` };
  }
}

/**
 * O lema do vocabulário para o que foi digitado. Acento só importa para separar duas palavras
 * ("coco" e "cocô"); plural, feminino e verbo conjugado viram o lema ("cachorras" → "cachorro").
 */
export function resolveWord(input: string): { word: string } | { error: string } {
  const text = input.trim().toLowerCase();
  if (!text) return { error: "Digite uma palavra" };
  if (/\s/.test(text)) return { error: "Só uma palavra por vez" };
  for (const candidate of [text, ...lemmaCandidates(text)]) {
    const found = lookup(candidate);
    if (found) return found;
  }
  return { error: "Não conhecemos essa palavra" };
}

/**
 * Uma palavra mais perto que o melhor chute: no começo corta o caminho pela metade, perto do fim
 * anda uma posição. Pula as que já saíram e nunca entrega a resposta.
 */
function hint(ranking: Ranking, previous: readonly Guess<SentidoFeedback>[]): SentidoFeedback | undefined {
  const best = Math.min(...previous.map((g) => g.feedback.rank));
  const target = best === Infinity ? FIRST_HINT : best <= CLOSE ? best - 1 : Math.floor(best / 2);
  const seen = new Set(previous.map((g) => g.feedback.word));
  const limit = Math.min(best, words.length + 1);
  const usable = (rank: number) => ranking.order[rank - 1] < HINT_WORDS && !seen.has(words[ranking.order[rank - 1]]);
  const give = (rank: number) => ({ word: words[ranking.order[rank - 1]], rank, hint: true as const });
  for (let r = target; r >= 2; r--) if (usable(r)) return give(r);
  for (let r = target + 1; r < limit; r++) if (usable(r)) return give(r);
}

export const engine: GameEngine<SentidoPuzzle, string, SentidoFeedback> = {
  createChallenge(dateKey) {
    return { puzzle: {}, answer: pickDaily(ANSWERS, { slug: "sentido", dateKey }) };
  },

  checkGuess(input, answer, previous) {
    const ranking = rankingFor(answer);
    if (input === HINT) {
      const feedback = hint(ranking, previous);
      if (!feedback) return { ok: false, error: "Não há dica mais perto: só falta a palavra secreta" };
      return { ok: true, solved: false, feedback };
    }
    const found = resolveWord(input);
    if ("error" in found) return { ok: false, error: found.error };
    if (previous.some((g) => g.feedback.word === found.word)) {
      return { ok: false, error: `Você já tentou ${found.word}` };
    }
    const rank = ranking.rank[index.get(found.word)!];
    return { ok: true, solved: rank === 1, feedback: { word: found.word, rank } };
  },

  describeAnswer: (word) => word,
};
