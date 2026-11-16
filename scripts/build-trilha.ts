/**
 * Gera os tabuleiros da Trilha.
 *
 *   pnpm data:trilha
 *
 * Sem fonte externa. Para cada tabuleiro:
 *  1. sorteia a solução: um caminho que passa por todas as casas, embaralhado com "backbite" a
 *     partir de um zigue-zague (cada passo liga uma ponta a uma vizinha e desfaz o laço que formou);
 *  2. sorteia algumas paredes entre casas que o caminho não liga;
 *  3. começa com um número a cada duas casas do caminho e vai tirando números, em ordem sorteada,
 *     enquanto o tabuleiro continuar com uma solução só, justo e sem trecho comprido demais;
 *  4. tira as paredes que deixaram de fazer diferença.
 *
 * Justo quer dizer que dá para jogar trecho a trecho sem chute: todo trecho errado que parece possível
 * trava em no máximo MAX_LOOKAHEAD + 1 trechos (games/trilha/solver.ts, `lookahead`).
 *
 * Saída: games/trilha/data/boards.json, cada tabuleiro com a casa de cada número (em ordem), as
 * paredes (pares de casas vizinhas) e o caminho da solução.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRng, shuffle, type Rng } from "../lib/daily/seed";
import { SIZE } from "../games/trilha/rules";
import { countSolutions, edgeKey, lookahead, neighbors, type Board, type Wall } from "../games/trilha/solver";

const ROOT = join(import.meta.dirname, "..");
const COUNT = 400;
/** Mais casas que isso entre dois números vira desenho às cegas. */
const MAX_SEGMENT = 10;
const MAX_WALLS = 6;
/** Quantos trechos à frente é preciso olhar para descartar um trecho errado, além do próximo. */
const MAX_LOOKAHEAD = 1;

/** Linha por linha, indo e voltando: o caminho de partida do embaralhamento. */
function zigzag(n: number): number[] {
  return Array.from({ length: n * n }, (_, i) => {
    const row = Math.floor(i / n);
    const col = i % n;
    return row * n + (row % 2 ? n - 1 - col : col);
  });
}

/**
 * Um passo de "backbite": liga uma das pontas a uma vizinha qualquer no tabuleiro, o que fecha um
 * laço, e abre o laço do outro lado da vizinha. Continua passando por todas as casas.
 */
function backbite(n: number, path: number[], rng: Rng) {
  if (rng() < 0.5) path.reverse();
  const last = path.length - 1;
  const options = neighbors(n, path[last]).filter((c) => c !== path[last - 1]);
  const j = path.indexOf(options[Math.floor(rng() * options.length)]);
  path.splice(j + 1, last - j, ...path.slice(j + 1).reverse());
}

function randomPath(n: number, rng: Rng): number[] {
  const path = zigzag(n);
  for (let i = 0; i < n * n * 60; i++) backbite(n, path, rng);
  return rng() < 0.5 ? path : path.reverse();
}

const fair = (board: Board, path: number[]) => countSolutions(board) === 1 && Math.max(...lookahead(board, path)) <= MAX_LOOKAHEAD;

function generate(n: number, rng: Rng): { board: Board; path: number[] } {
  for (;;) {
    const path = randomPath(n, rng);
    const used = new Set(path.slice(1).map((c, i) => edgeKey(path[i], c)));
    const unused: Wall[] = [];
    for (let i = 0; i < n * n; i++) for (const j of neighbors(n, i)) if (i < j && !used.has(edgeKey(i, j))) unused.push([i, j]);
    let walls = shuffle(unused, rng).slice(0, Math.floor(rng() * (MAX_WALLS + 1)));

    // Posições (no caminho) das casas com número: o começo, o fim e uma a cada duas no meio.
    let stops = [...path.keys()].filter((i) => i % 2 === 0 || i === path.length - 1);
    const boardOf = (s: number[], w: Wall[]): Board => ({ size: n, numbers: s.map((i) => path[i]), walls: w });
    if (!fair(boardOf(stops, walls), path)) continue;

    for (const stop of shuffle(stops.slice(1, -1), rng)) {
      const k = stops.indexOf(stop);
      if (stops[k + 1] - stops[k - 1] > MAX_SEGMENT) continue;
      const fewer = stops.filter((s) => s !== stop);
      if (fair(boardOf(fewer, walls), path)) stops = fewer;
    }
    for (const wall of shuffle(walls, rng)) {
      const fewer = walls.filter((w) => w !== wall);
      if (fair(boardOf(stops, fewer), path)) walls = fewer;
    }
    return { board: boardOf(stops, walls), path };
  }
}

const rng = createRng(`trilha:build:${SIZE}`);
const boards: { numbers: number[]; walls: Wall[]; path: number[] }[] = [];
const seen = new Set<string>();
const started = Date.now();
while (boards.length < COUNT) {
  const { board, path } = generate(SIZE, rng);
  const walls = board.walls.map(([a, b]) => (a < b ? [a, b] : [b, a]) as Wall).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const key = JSON.stringify([board.numbers, walls]);
  if (seen.has(key)) continue;
  seen.add(key);
  boards.push({ numbers: [...board.numbers], walls, path });
}
writeFileSync(join(ROOT, "games/trilha/data/boards.json"), JSON.stringify(boards));

const numbers = boards.map((b) => b.numbers.length);
const walled = boards.filter((b) => b.walls.length).length;
console.log(
  `  ${SIZE}×${SIZE}: ${boards.length} tabuleiros em ${Math.round((Date.now() - started) / 1000)}s, ` +
    `${Math.min(...numbers)} a ${Math.max(...numbers)} números, ${walled} com paredes`,
);
