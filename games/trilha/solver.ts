/**
 * Regras e solucionador da Trilha, usados para gerar os tabuleiros (scripts/build-trilha.ts), para
 * testar que cada um tem uma solução só e, no tabuleiro, para saber por onde o caminho pode andar.
 *
 * Tabuleiro `n`×`n`, casas numeradas por linha (`i = linha * n + coluna`). `numbers[k]` é a casa do
 * número k + 1, e `walls` são pares de casas vizinhas com uma parede no meio. Uma solução é um
 * caminho que passa uma vez por cada casa, sempre para uma vizinha sem parede no meio, começa no 1,
 * passa pelos números em ordem e termina no último.
 *
 * Um caminho assim é uma fila de trechos, cada um de um número até o seguinte. A busca anda trecho a
 * trecho, que é também como a pessoa joga: cada trecho é conferido quando chega no número.
 */

export type Wall = readonly [number, number];

export interface Board {
  size: number;
  numbers: readonly number[];
  walls: readonly Wall[];
}

export const rowOf = (n: number, i: number) => Math.floor(i / n);
export const colOf = (n: number, i: number) => i % n;

/** As vizinhas de cima, de baixo, da esquerda e da direita. */
export function neighbors(n: number, i: number): number[] {
  const out: number[] = [];
  if (i >= n) out.push(i - n);
  if (i + n < n * n) out.push(i + n);
  if (i % n) out.push(i - 1);
  if ((i + 1) % n) out.push(i + 1);
  return out;
}

/** A mesma chave nos dois sentidos: a parede entre 3 e 4 é a parede entre 4 e 3. */
export const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Para cada casa, as vizinhas sem parede no meio: por onde o caminho pode seguir. */
export function linksOf(n: number, walls: readonly Wall[]): number[][] {
  const blocked = new Set(walls.map(([a, b]) => edgeKey(a, b)));
  return Array.from({ length: n * n }, (_, i) => neighbors(n, i).filter((j) => !blocked.has(edgeKey(i, j))));
}

/** O número (a partir de 0) de cada casa, ou -1 nas casas sem número. */
export function numberIndex(n: number, numbers: readonly number[]): number[] {
  const at = new Array<number>(n * n).fill(-1);
  numbers.forEach((cell, k) => (at[cell] = k));
  return at;
}

/**
 * O que a busca precisa saber de um tabuleiro, com as casas já visitadas. `eachSegment` lista os
 * trechos plausíveis da ponta até o próximo número: os que não deixam para trás uma casa sem saída
 * (com menos de duas vizinhas livres, ou uma se for o fim) nem um pedaço do tabuleiro separado da
 * ponta. Um trecho certo sempre é plausível; um errado pode ser, e aí só se descobre mais adiante.
 */
function searcher(board: Board) {
  const { size: n, numbers } = board;
  const total = n * n;
  const links = linksOf(n, board.walls);
  const at = numberIndex(n, numbers);
  const end = numbers[numbers.length - 1];
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  const seen = new Uint8Array(total);
  let count = 0;

  const visit = (cell: number) => {
    visited[cell] = 1;
    count++;
  };
  const leave = (cell: number) => {
    visited[cell] = 0;
    count--;
  };

  /** Com a ponta em `head`, ainda dá para cobrir o resto? (Necessário, não suficiente.) */
  function alive(head: number): boolean {
    if (count === total) return true;
    for (let u = 0; u < total; u++) {
      if (visited[u]) continue;
      let free = 0;
      for (const v of links[u]) if (!visited[v] || v === head) free++;
      if (free < (u === end ? 1 : 2)) return false;
    }
    seen.fill(0);
    let read = 0;
    let write = 0;
    queue[write++] = head;
    seen[head] = 1;
    let reached = 0;
    while (read < write) {
      for (const v of links[queue[read++]]) {
        if (visited[v] || seen[v]) continue;
        seen[v] = 1;
        reached++;
        queue[write++] = v;
      }
    }
    return reached === total - count;
  }

  /**
   * Chama `found` com cada trecho plausível de `head` até `target` (sem `head`, com `target`), com o
   * trecho já marcado como visitado. Para e devolve `true` assim que `found` devolver `true`.
   */
  function eachSegment(head: number, target: number, found: (segment: number[]) => boolean): boolean {
    const segment: number[] = [];
    const go = (from: number): boolean => {
      for (const c of links[from]) {
        if (visited[c] || (at[c] >= 0 && c !== target) || (c === end && count + 1 !== total)) continue;
        visit(c);
        segment.push(c);
        const stop = alive(c) && (c === target ? found(segment) : go(c));
        segment.pop();
        leave(c);
        if (stop) return true;
      }
      return false;
    };
    return go(head);
  }

  /** Todas as continuações a partir do número `k` (o caminho já chegou nele). */
  function solutions(k: number, path: number[], found: (path: number[]) => boolean): boolean {
    if (k === numbers.length - 1) return count === total && found(path);
    return eachSegment(numbers[k], numbers[k + 1], (segment) => solutions(k + 1, [...path, ...segment], found));
  }

  return { total, visit, eachSegment, solutions, count: () => count };
}

/** Chama `found` com cada solução, até ele devolver `true`. */
function eachSolution(board: Board, found: (path: number[]) => boolean) {
  const s = searcher(board);
  const start = board.numbers[0];
  s.visit(start);
  s.solutions(0, [start], found);
}

/** Quantas soluções o tabuleiro tem, contando até `limit` (para provar que é única, 2 basta). */
export function countSolutions(board: Board, limit = 2): number {
  let count = 0;
  eachSolution(board, () => ++count >= limit);
  return count;
}

/** A primeira solução que aparecer, ou null se não houver nenhuma. */
export function solve(board: Board): number[] | null {
  let solution: number[] | null = null;
  eachSolution(board, (path) => {
    solution = path;
    return true;
  });
  return solution;
}

/**
 * Quão longe é preciso olhar para descartar os trechos errados. Para cada trecho da solução, a pior
 * das alternativas plausíveis: -1 se não há nenhuma (o trecho é forçado), 0 se depois dela não dá
 * nem para chegar ao número seguinte, 1 se só trava um trecho depois, e assim por diante, até `cap`.
 */
export function lookahead(board: Board, path: readonly number[], cap = 3): number[] {
  const { numbers } = board;
  const position = numbers.map((cell) => path.indexOf(cell));
  const out: number[] = [];
  for (let k = 0; k < numbers.length - 1; k++) {
    const s = searcher(board);
    for (let i = 0; i <= position[k]; i++) s.visit(path[i]);
    const truth = path.slice(position[k] + 1, position[k + 1] + 1).join();
    /** Quantos trechos ainda dá para emendar a partir do número `j`, até `left`. */
    const depth = (j: number, left: number): number => {
      if (j === numbers.length - 1) return s.count() === s.total ? Infinity : 0;
      let best = 0;
      if (left > 0) s.eachSegment(numbers[j], numbers[j + 1], () => (best = Math.max(best, 1 + depth(j + 1, left - 1))) >= left);
      return best;
    };
    let worst = -1;
    s.eachSegment(numbers[k], numbers[k + 1], (segment) => {
      if (segment.join() !== truth) worst = Math.max(worst, depth(k + 1, cap));
      return worst >= cap;
    });
    out.push(worst);
  }
  return out;
}

/**
 * O caminho é uma solução do tabuleiro? Passa por todas as casas uma vez, sempre entre vizinhas sem
 * parede, começa no 1, encontra os números em ordem e termina no último.
 */
export function isSolution(board: Board, path: readonly number[]): boolean {
  const { size: n, numbers } = board;
  if (path.length !== n * n || new Set(path).size !== n * n) return false;
  const links = linksOf(n, board.walls);
  if (path.some((c, i) => i > 0 && !links[path[i - 1]].includes(c))) return false;
  const order = path.filter((c) => numbers.includes(c));
  return (
    path[0] === numbers[0] &&
    path[path.length - 1] === numbers[numbers.length - 1] &&
    order.length === numbers.length &&
    order.every((c, k) => c === numbers[k])
  );
}
