import { challengeNumber } from "./date";

/**
 * Segredo que torna a sequência de desafios imprevisível mesmo com o código e as listas abertas.
 * Enquanto não há backend ele é público (NEXT_PUBLIC_); quando a validação for para o servidor,
 * vira uma variável só do servidor e esta função passa a usar HMAC.
 */
export const DAILY_SEED = process.env.NEXT_PUBLIC_DAILY_SEED ?? "rodada-dev";

/** Hash de string em 32 bits (cyrb53 truncado). Determinístico em qualquer runtime. */
function hash(input: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 ^ h1) >>> 0;
}

export type Rng = () => number;

/** PRNG mulberry32: mesma seed, mesma sequência de números em [0, 1). */
export function createRng(seed: string): Rng {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates com o PRNG dado; não altera a lista original. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Escolhe o item do dia sem repetir até a lista acabar: cada "ciclo" de N dias percorre
 * uma permutação diferente da lista.
 */
export function pickDaily<T>(
  pool: readonly T[],
  { slug, dateKey, seed = DAILY_SEED }: { slug: string; dateKey: string; seed?: string },
): T {
  if (pool.length === 0) throw new Error(`pool vazio para ${slug}`);
  const day = challengeNumber(dateKey) - 1;
  const cycle = Math.floor(day / pool.length);
  const order = shuffle(pool, createRng(`${seed}:${slug}:${cycle}`));
  return order[((day % pool.length) + pool.length) % pool.length];
}
