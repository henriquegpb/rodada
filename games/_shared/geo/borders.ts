import data from "./borders.json";

/** Fronteiras terrestres: código → vizinhos. Gerado de Natural Earth em scripts/build-data.ts. */
export const borders: Readonly<Record<string, readonly string[]>> = data;

/** Distância em número de fronteiras de `from` até todos os países alcançáveis por terra. */
export function borderDistances(from: string, allowed?: ReadonlySet<string>): Map<string, number> {
  const dist = new Map([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const next of borders[current] ?? []) {
      if (dist.has(next) || (allowed && !allowed.has(next))) continue;
      dist.set(next, dist.get(current)! + 1);
      queue.push(next);
    }
  }
  return dist;
}

/** Um menor caminho por terra de `from` até `to`, incluindo as pontas; vazio se não houver. */
export function shortestPath(from: string, to: string): string[] {
  const back = borderDistances(to);
  if (!back.has(from)) return [];
  const path = [from];
  let current = from;
  while (current !== to) {
    // Sempre o vizinho mais perto do destino; empate resolvido pela ordem alfabética do código.
    current = [...borders[current]].sort().find((n) => back.get(n) === back.get(current)! - 1)!;
    path.push(current);
  }
  return path;
}

/** Os países em `through` (mais as pontas) já formam um caminho de `from` até `to`? */
export function connects(from: string, to: string, through: Iterable<string>): boolean {
  return borderDistances(from, new Set([...through, from, to])).has(to);
}
