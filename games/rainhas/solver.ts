/**
 * Regras e solucionadores das Rainhas, usados para gerar os tabuleiros (scripts/build-rainhas.ts) e
 * para testar que cada um tem uma solução só e sai por dedução, sem chute.
 *
 * Tabuleiro `n`×`n`, casas numeradas por linha (`i = linha * n + coluna`), `regions[i]` é a cor da
 * casa (0 a n-1). Uma solução é uma rainha por linha, coluna e cor, e nenhuma encosta em outra,
 * nem na diagonal.
 */

export const rowOf = (n: number, i: number) => Math.floor(i / n);
export const colOf = (n: number, i: number) => i % n;

/** Duas casas diferentes que não podem ter rainha ao mesmo tempo. */
export function conflicts(n: number, regions: readonly number[], a: number, b: number): boolean {
  if (a === b) return false;
  const dr = Math.abs(rowOf(n, a) - rowOf(n, b));
  const dc = Math.abs(colOf(n, a) - colOf(n, b));
  return dr === 0 || dc === 0 || regions[a] === regions[b] || (dr <= 1 && dc <= 1);
}

/** Uma solução diferente de `cols` (coluna da rainha em cada linha), ou null se `cols` é a única. */
export function otherSolution(n: number, regions: readonly number[], cols: readonly number[]): number[] | null {
  const colUsed = new Array<boolean>(n).fill(false);
  const regionUsed = new Array<boolean>(n).fill(false);
  const current: number[] = [];
  const go = (row: number): boolean => {
    if (row === n) return current.some((c, r) => c !== cols[r]);
    for (let c = 0; c < n; c++) {
      const g = regions[row * n + c];
      if (colUsed[c] || regionUsed[g] || (row > 0 && Math.abs(c - current[row - 1]) < 2)) continue;
      colUsed[c] = regionUsed[g] = true;
      current.push(c);
      if (go(row + 1)) return true;
      colUsed[c] = regionUsed[g] = false;
      current.pop();
    }
    return false;
  };
  return go(0) ? [...current] : null;
}

/**
 * Resolve só por dedução, como uma pessoa faria. Devolve as colunas da solução, ou null se travar.
 * Técnicas, da mais simples à mais trabalhosa:
 *  1. linha, coluna ou cor com uma casa só possível;
 *  2. k cores presas em k linhas (ou colunas): o resto dessas linhas sai; e o inverso;
 *  3. casa que, com rainha, deixaria alguma linha, coluna ou cor sem lugar.
 */
export function solveByLogic(n: number, regions: readonly number[]): number[] | null {
  const total = n * n;
  const open = new Array<boolean>(total).fill(true);
  const queens: number[] = [];
  const cells = [...Array(total).keys()];
  const units: number[][] = [];
  for (let k = 0; k < n; k++) {
    units.push(cells.filter((i) => rowOf(n, i) === k));
    units.push(cells.filter((i) => colOf(n, i) === k));
    units.push(cells.filter((i) => regions[i] === k));
  }
  const filled = (unit: number[]) => unit.some((i) => queens.includes(i));
  const place = (i: number) => {
    queens.push(i);
    for (const j of cells) if (j === i || conflicts(n, regions, i, j)) open[j] = false;
  };
  const keyOf = {
    region: (i: number) => regions[i],
    row: (i: number) => rowOf(n, i),
    col: (i: number) => colOf(n, i),
  };
  type Kind = keyof typeof keyOf;
  const pairs: [Kind, Kind][] = [
    ["region", "row"],
    ["region", "col"],
    ["row", "region"],
    ["col", "region"],
  ];
  const subsets = (items: number[], k: number, start = 0): number[][] =>
    k === 0 ? [[]] : items.slice(start).flatMap((x, i) => subsets(items, k - 1, start + i + 1).map((s) => [x, ...s]));

  while (queens.length < n) {
    let progress = false;

    for (const unit of units) {
      if (filled(unit)) continue;
      const options = unit.filter((i) => open[i]);
      if (options.length === 0) return null;
      if (options.length === 1) {
        place(options[0]);
        progress = true;
        break;
      }
    }
    if (progress) continue;

    for (const [a, b] of pairs) {
      const groups = [...Array(n).keys()].filter((g) => !queens.some((q) => keyOf[a](q) === g));
      for (let k = 1; k <= 3 && !progress; k++) {
        for (const set of subsets(groups, k)) {
          const span = new Set(cells.filter((i) => open[i] && set.includes(keyOf[a](i))).map(keyOf[b]));
          if (span.size !== k) continue;
          for (const i of cells) {
            if (open[i] && span.has(keyOf[b](i)) && !set.includes(keyOf[a](i))) {
              open[i] = false;
              progress = true;
            }
          }
          if (progress) break;
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    for (const i of cells) {
      if (!open[i]) continue;
      const starves = units.some(
        (unit) => !filled(unit) && !unit.includes(i) && unit.every((j) => !open[j] || conflicts(n, regions, i, j)),
      );
      if (starves) {
        open[i] = false;
        progress = true;
        break;
      }
    }
    if (!progress) return null;
  }
  return queens.sort((a, b) => a - b).map((i) => colOf(n, i));
}
