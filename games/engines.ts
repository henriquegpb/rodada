import type { GameEngine } from "./types";

/**
 * Registro das engines (a metade que conhece a resposta). Carregadas sob demanda para
 * que as listas de respostas não entrem no bundle das outras páginas.
 *
 * Ao adicionar um jogo, registre também em ./index.ts.
 */
const loaders: Record<string, () => Promise<{ engine: GameEngine }>> = {
  palavra: () => import("./palavra/engine"),
  bandeira: () => import("./bandeira/engine"),
  pais: () => import("./pais/engine"),
  mundo: () => import("./mundo/engine"),
};

export const engineSlugs = Object.keys(loaders);

export async function loadEngine(slug: string): Promise<GameEngine> {
  const load = loaders[slug];
  if (!load) throw new Error(`jogo desconhecido: ${slug}`);
  return (await load()).engine;
}
