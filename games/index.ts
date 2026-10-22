import type { GameDefinition } from "./types";
import { palavra } from "./palavra";
import { bandeira } from "./bandeira";
import { pais } from "./pais";
import { mosaico } from "./mosaico";
import { rota } from "./rota";
import { calor } from "./calor";
import { mundo } from "./mundo";

/**
 * Registro dos jogos, na ordem em que aparecem no site.
 * Ao adicionar um jogo, registre também a engine em ./engines.ts.
 */
export const games: GameDefinition[] = [palavra, bandeira, pais, mosaico, rota, calor, mundo] as GameDefinition[];

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.meta.slug === slug);
}
