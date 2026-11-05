import { DAILY_SEED, createRng, pickDailyMany } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { ROUNDS, aspectOf, fits, scoreOf } from "./scene";
import type { EscalaFeedback, EscalaItemView, EscalaPuzzle } from "./types";

/** Uma coisa do catálogo: o desenho e o tamanho de verdade (metros, do lado perguntado). */
export interface CatalogItem extends EscalaItemView {
  size: number;
}

const withAspect = (item: CatalogItem) => ({ measure: item.measure, size: item.size, aspect: aspectOf(item.shape) });

/** As referências que cabem bem na cena com este alvo. */
export function referencesFor(pool: readonly CatalogItem[], target: CatalogItem): CatalogItem[] {
  return pool.filter((r) => r !== target && fits(withAspect(r), withAspect(target)));
}

/**
 * Engine dos jogos de escala: 5 rodadas, cada uma com uma referência no tamanho de verdade e um
 * alvo para deixar no tamanho certo. A resposta é o tamanho de cada alvo.
 *
 * Os alvos saem de `pickDailyMany` (sem repetir até o catálogo acabar); a referência de cada um é
 * sorteada entre as que cabem na cena com ele, com a seed do dia.
 */
export function createEscalaEngine(slug: string, pool: readonly CatalogItem[]): GameEngine<EscalaPuzzle, number[], EscalaFeedback> {
  return {
    createChallenge(dateKey) {
      const targets = pickDailyMany(pool, ROUNDS, { slug, dateKey });
      const used = new Set<CatalogItem>(targets);
      const rng = createRng(`${DAILY_SEED}:${slug}:ref:${dateKey}`);
      const rounds = targets.map((target) => {
        const options = referencesFor(pool, target);
        const fresh = options.filter((r) => !used.has(r));
        const list = fresh.length ? fresh : options;
        const reference = list[Math.floor(rng() * list.length)];
        used.add(reference);
        return {
          reference: { name: reference.name, measure: reference.measure, shape: reference.shape, size: reference.size },
          target: { name: target.name, measure: target.measure, shape: target.shape },
        };
      });
      return { puzzle: { rounds }, answer: targets.map((t) => t.size) };
    },

    checkGuess(input, answer, previous) {
      if (previous.length >= ROUNDS) return { ok: false, error: "As 5 rodadas já acabaram" };
      const guess = Number(input);
      if (!Number.isFinite(guess) || guess <= 0) return { ok: false, error: "Ajuste o tamanho antes de confirmar" };
      const actual = answer[previous.length];
      // A partida acaba quando a pessoa vê o resultado (o tabuleiro chama `finish`).
      return { ok: true, solved: false, feedback: { guess, actual, points: scoreOf(guess, actual) } };
    },

    describeAnswer: () => "",

    maxPoints: () => ROUNDS * 100,
  };
}
