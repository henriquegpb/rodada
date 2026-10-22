import type { GameEngine } from "./types";

/**
 * Registro das engines (a metade que conhece a resposta). Carregadas sob demanda para
 * que as listas de respostas não entrem no bundle das outras páginas.
 *
 * Ao adicionar um jogo, registre também em ./index.ts.
 */
const loaders: Record<string, () => Promise<{ engine: GameEngine }>> = {
  palavra: () => import("./palavra/engine"),
  dupla: () => import("./dupla/engine"),
  quadra: () => import("./quadra/engine"),
  bandeira: () => import("./bandeira/engine"),
  pais: () => import("./pais/engine"),
  mosaico: () => import("./mosaico/engine"),
  rota: () => import("./rota/engine"),
  calor: () => import("./calor/engine"),
  mundo: () => import("./mundo/engine"),
};

export const engineSlugs = Object.keys(loaders);

const loaded = new Map<string, GameEngine>();

export async function loadEngine(slug: string): Promise<GameEngine> {
  const load = loaders[slug];
  if (!load) throw new Error(`jogo desconhecido: ${slug}`);
  const { engine } = await load();
  loaded.set(slug, engine);
  return engine;
}

/** A engine, se já foi carregada; permite montar a página do jogo sem um quadro vazio. */
export function peekEngine(slug: string): GameEngine | undefined {
  return loaded.get(slug);
}

/** Começa a baixar a engine sem esperar (ex.: ao passar o mouse sobre o link do jogo). */
export function preloadEngine(slug: string) {
  if (!loaded.has(slug) && loaders[slug]) loadEngine(slug).catch(() => {});
}
