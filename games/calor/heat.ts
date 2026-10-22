/** Escala de calor por distância: vermelho-escuro colado no país secreto, creme do outro lado do mundo. */
const STOPS: [km: number, rgb: [number, number, number]][] = [
  [0, [127, 29, 29]],
  [300, [185, 28, 28]],
  [1000, [239, 68, 68]],
  [2500, [249, 115, 22]],
  [5000, [251, 191, 36]],
  [10_000, [253, 230, 138]],
  [15_000, [254, 243, 199]],
];

export const ANSWER_COLOR = "#22c47e";

export function heatColor(km: number): string {
  if (km <= STOPS[0][0]) return rgb(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    const [k1, c1] = STOPS[i];
    if (km <= k1) {
      const [k0, c0] = STOPS[i - 1];
      const t = (km - k0) / (k1 - k0);
      return rgb(c0.map((v, j) => v + (c1[j] - v) * t) as [number, number, number]);
    }
  }
  return rgb(STOPS[STOPS.length - 1][1]);
}

const rgb = ([r, g, b]: [number, number, number]) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

/** Faixa do compartilhamento, do mais quente ao mais frio. */
export function heatEmoji(km: number): string {
  return km === 0 ? "🟥" : km < 1000 ? "🟧" : km < 3000 ? "🟨" : "⬜";
}
