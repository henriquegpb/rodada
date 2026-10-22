import type { GameDefinition } from "./types";
import { palavra } from "./palavra";
import { bandeira } from "./bandeira";
import { pais } from "./pais";
import { mundo } from "./mundo";

/**
 * Registro dos jogos, na ordem em que aparecem no site.
 * Ao adicionar um jogo, registre também a engine em ./engines.ts.
 */
export const games: GameDefinition[] = [palavra, bandeira, pais, mundo] as GameDefinition[];

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.meta.slug === slug);
}
