import type { Measure, Shape } from "./types";

/**
 * A cena onde as duas coisas ficam lado a lado no chão. A escala sai só da referência, para o
 * desenho não entregar o tamanho do alvo; o alvo pode crescer até ocupar o espaço que sobra.
 * A engine usa as mesmas contas para só sortear pares que cabem bem na cena.
 */
export const SCENE = { W: 800, H: 460, GROUND: 420, LEFT: 40, GAP: 56, REF_W: 150, REF_H: 100 } as const;

export const ROUNDS = 5;

/** Largura ÷ altura do desenho. */
export const aspectOf = (shape: Shape) => (shape.kind === "image" ? shape.aspect : shape.box[2] / shape.box[3]);

/** A medida é a largura do desenho (comprimento, envergadura), não a altura. */
export const usesWidth = (measure: Measure) => measure === "comprimento" || measure === "envergadura";

/** Largura e altura de verdade, em metros, de algo com `size` no lado perguntado. */
export function dims(measure: Measure, size: number, aspect: number): [w: number, h: number] {
  return usesWidth(measure) ? [size, size / aspect] : [size * aspect, size];
}

export interface Layout {
  /** Pixels por metro. */
  ppm: number;
  /** Onde o alvo começa. */
  x0: number;
  /** Maior e menor palpite, em metros, do lado perguntado. */
  max: number;
  min: number;
}

export function layout(
  reference: { measure: Measure; size: number; aspect: number },
  target: { measure: Measure; aspect: number },
): Layout {
  const { W, GROUND, LEFT, GAP, REF_W, REF_H } = SCENE;
  const [rw, rh] = dims(reference.measure, reference.size, reference.aspect);
  const ppm = Math.min(REF_H / rh, REF_W / rw);
  const x0 = LEFT + rw * ppm + GAP;
  // Altura máxima do alvo, em pixels, para caber na largura e na altura que sobram.
  const maxH = Math.min(GROUND - 16, (W - x0 - 24) / target.aspect);
  const max = (usesWidth(target.measure) ? maxH * target.aspect : maxH) / ppm;
  return { ppm, x0, max, min: max / 14 };
}

/**
 * O par serve? O alvo de verdade precisa caber com folga (o palpite vai até 1,6× ele) e não pode
 * ficar pequeno demais para enxergar.
 */
export function fits(
  reference: { measure: Measure; size: number; aspect: number },
  target: { measure: Measure; size: number; aspect: number },
): boolean {
  const { max } = layout(reference, target);
  return target.size <= max / 1.6 && target.size >= max / 11;
}

/** 100 no tamanho certo; zero ao errar por 2,5 vezes, para mais ou para menos. */
export function scoreOf(guess: number, actual: number): number {
  return Math.max(0, Math.round(100 * (1 - Math.abs(Math.log(guess / actual)) / Math.log(2.5))));
}

/** 1,5 cm · 33 cm · 2,1 m · 93 m · 4.304 km */
export function formatSize(m: number): string {
  const n = (v: number, digits = 0) => v.toLocaleString("pt-BR", { maximumFractionDigits: digits });
  if (m < 1) return `${n(m * 100, m < 0.1 ? 1 : 0)} cm`;
  if (m < 1000) return `${n(m, m < 10 ? 2 : 1)} m`;
  return `${n(m / 1000)} km`;
}

/** Cor da nota: verde, amarelo, laranja ou vermelho. */
export function pointsColor(points: number): string {
  return points >= 80 ? "#22c47e" : points >= 50 ? "#eab308" : points >= 20 ? "#f97316" : "#e5484d";
}

export function pointsEmoji(points: number): string {
  return points >= 80 ? "🟩" : points >= 50 ? "🟨" : points >= 20 ? "🟧" : "🟥";
}
