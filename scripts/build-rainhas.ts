/**
 * Gera os tabuleiros das Rainhas (o Queens do LinkedIn), em 8×8, 9×9 e 10×10.
 *
 *   pnpm data:rainhas
 *
 * Sem fonte externa. Para cada tabuleiro:
 *  1. sorteia a solução: uma rainha por linha e coluna, sem duas encostadas;
 *  2. cresce uma região de cor a partir de cada rainha, todas no mesmo ritmo;
 *  3. enquanto houver outra solução, passa uma casa dela para a região vizinha (sem quebrar a
 *     região de onde saiu), até sobrar só a sorteada;
 *  4. fica só se sair por dedução (games/rainhas/solver.ts), sem chute, e sem região de 1 casa.
 *
 * Saída: games/rainhas/data/<n>.json, cada tabuleiro com as cores ("aabbc…", uma letra por casa,
 * linha a linha) e a coluna da rainha em cada linha.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRng, shuffle, type Rng } from "../lib/daily/seed";
import { otherSolution, solveByLogic } from "../games/rainhas/solver";

const ROOT = join(import.meta.dirname, "..");
const SIZES = [8, 9, 10];
const PER_SIZE = 400;
/** Região menor que isso entrega a rainha de graça. */
const MIN_REGION = 2;
/** Passos de ajuste antes de desistir do tabuleiro e sortear outro. */
const MAX_STEPS = 400;

const neighbors = (n: number, i: number) =>
  [i >= n ? i - n : -1, i + n < n * n ? i + n : -1, i % n ? i - 1 : -1, (i + 1) % n ? i + 1 : -1].filter((j) => j >= 0);

function randomSolution(n: number, rng: Rng): number[] {
  const cols: number[] = [];
  const used = new Set<number>();
  const go = (row: number): boolean => {
    if (row === n) return true;
    for (const c of shuffle([...Array(n).keys()], rng)) {
      if (used.has(c) || (row > 0 && Math.abs(c - cols[row - 1]) < 2)) continue;
      used.add(c);
      cols.push(c);
      if (go(row + 1)) return true;
      used.delete(c);
      cols.pop();
    }
    return false;
  };
  go(0);
  return cols;
}

/** Cada região cresce uma casa por vez, sorteando a região por igual: nenhuma fica nanica. */
function growRegions(n: number, cols: number[], rng: Rng): number[] {
  const regions = new Array<number>(n * n).fill(-1);
  cols.forEach((c, row) => (regions[row * n + c] = row));
  for (let left = n * n - n; left > 0; ) {
    for (const id of shuffle([...Array(n).keys()], rng)) {
      const frontier = regions.flatMap((g, i) => (g === -1 && neighbors(n, i).some((j) => regions[j] === id) ? [i] : []));
      if (!frontier.length) continue;
      regions[frontier[Math.floor(rng() * frontier.length)]] = id;
      left--;
      break;
    }
  }
  return regions;
}

/** Tirar a casa `i` da região dela deixa o resto conectado e com pelo menos MIN_REGION casas? */
function canGiveAway(n: number, regions: number[], i: number): boolean {
  const rest = regions.flatMap((g, k) => (g === regions[i] && k !== i ? [k] : []));
  if (rest.length < MIN_REGION) return false;
  const seen = new Set([rest[0]]);
  const stack = [rest[0]];
  while (stack.length) {
    for (const j of neighbors(n, stack.pop()!)) {
      if (j !== i && regions[j] === regions[i] && !seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return seen.size === rest.length;
}

function generate(n: number, rng: Rng): { regions: number[]; cols: number[] } {
  for (;;) {
    const cols = randomSolution(n, rng);
    const regions = growRegions(n, cols, rng);
    const queens = new Set(cols.map((c, row) => row * n + c));
    for (let other = otherSolution(n, regions, cols), step = 0; other && step < MAX_STEPS; step++) {
      // Uma casa da outra solução muda de cor: aquela solução deixa de valer.
      const cell = shuffle(
        other.map((c, row) => row * n + c).filter((i) => !queens.has(i)),
        rng,
      ).find((i) => canGiveAway(n, regions, i) && neighbors(n, i).some((j) => regions[j] !== regions[i]));
      if (cell === undefined) break;
      const targets = shuffle([...new Set(neighbors(n, cell).map((j) => regions[j]))].filter((g) => g !== regions[cell]), rng);
      regions[cell] = targets[0];
      other = otherSolution(n, regions, cols);
    }
    if (otherSolution(n, regions, cols)) continue;
    const sizes = new Array<number>(n).fill(0);
    for (const g of regions) sizes[g]++;
    if (Math.min(...sizes) < MIN_REGION) continue;
    const solved = solveByLogic(n, regions);
    if (!solved || solved.some((c, row) => c !== cols[row])) continue;
    return { regions, cols };
  }
}

for (const n of SIZES) {
  const rng = createRng(`rainhas:build:${n}`);
  const boards: { regions: string; queens: number[] }[] = [];
  const seen = new Set<string>();
  const started = Date.now();
  while (boards.length < PER_SIZE) {
    const { regions, cols } = generate(n, rng);
    // Letras renumeradas por ordem de aparição: o mesmo desenho não entra duas vezes.
    const order = [...new Set(regions)];
    const text = regions.map((g) => String.fromCharCode(97 + order.indexOf(g))).join("");
    if (seen.has(text)) continue;
    seen.add(text);
    boards.push({ regions: text, queens: cols });
  }
  writeFileSync(join(ROOT, `games/rainhas/data/${n}.json`), JSON.stringify(boards));
  console.log(`  ${n}×${n}: ${boards.length} tabuleiros em ${Math.round((Date.now() - started) / 1000)}s`);
}
