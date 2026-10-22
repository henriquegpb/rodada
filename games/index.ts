import type { GameDefinition } from "./types";
import { palavra } from "./palavra";
import { dupla } from "./dupla";
import { quadra } from "./quadra";
import { bandeira } from "./bandeira";
import { pais } from "./pais";
import { mosaico } from "./mosaico";
import { rota } from "./rota";
import { calor } from "./calor";
import { mundo } from "./mundo";

/**
 * Registro dos jogos (e modos), na ordem em que aparecem no site.
 * Ao adicionar um jogo, registre também a engine em ./engines.ts.
 */
export const games: GameDefinition[] = [palavra, dupla, quadra, bandeira, pais, mosaico, rota, calor, mundo] as GameDefinition[];

/** Os jogos da rodada do dia: tudo que não é modo de outro jogo. */
export const roundGames = games.filter((g) => !g.meta.parent);

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.meta.slug === slug);
}

/** O jogo da rodada a que este slug pertence (ele mesmo, ou o pai se for um modo). */
export function rootGame(slug: string): GameDefinition | undefined {
  const game = getGame(slug);
  return game?.meta.parent ? getGame(game.meta.parent) : game;
}

/** O jogo e seus modos, na ordem do registro (ex.: Palavra, Dupla, Quadra). */
export function modesOf(slug: string): GameDefinition[] {
  const root = rootGame(slug);
  if (!root) return [];
  return games.filter((g) => g === root || g.meta.parent === root.meta.slug);
}
