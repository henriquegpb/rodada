import type { PlayView } from "../types";
import type { IncomumFeedback } from "./types";

/** Cor do Incomum: o card do jogo e os botões. Azul do mar. */
export const COLOR = "#0e7fd6";

/** Categorias por dia. */
export const ROUND = 7;

/**
 * A raridade de cada resposta, de óbvia a raríssima: quanto menos óbvia, mais pontos. As cores são as
 * de raridade dos jogos (cinza, verde, azul, roxo, dourado), que todo mundo já reconhece. `upTo` é até que
 * fração da lista (ordenada da mais comum para a mais rara) a faixa vai: numa categoria de 100
 * respostas, as 3 primeiras são óbvias, da 4ª à 15ª comuns, e assim por diante.
 */
export const TIERS = [
  { name: "Óbvia", points: 10, upTo: 0.03, color: "#cbd5e1", emoji: "⬜" },
  { name: "Comum", points: 30, upTo: 0.15, color: "#4ade80", emoji: "🟩" },
  { name: "Incomum", points: 50, upTo: 0.45, color: "#22d3ee", emoji: "🟦" },
  { name: "Rara", points: 80, upTo: 0.8, color: "#c084fc", emoji: "🟪" },
  { name: "Raríssima", points: 100, upTo: 1, color: "#facc15", emoji: "🟨" },
] as const;

export const MAX_POINTS = ROUND * TIERS[TIERS.length - 1].points;

/** O fundo da Fossa das Marianas (o Abismo Challenger), em metros. */
export const MAX_DEPTH = 10_994;

/** As camadas do oceano, como os oceanógrafos chamam. */
export const ZONES = [
  { name: "Zona do sol", to: 200 },
  { name: "Zona do crepúsculo", to: 1000 },
  { name: "Zona da meia-noite", to: 4000 },
  { name: "Zona abissal", to: 6000 },
  { name: "Zona hadal", to: MAX_DEPTH },
] as const;

export type MilestoneArt =
  "lanterna" | "lula" | "agua-viva" | "cachalote" | "diabo" | "dumbo" | "porquinho" | "caracol" | "anfipode" | "fundo";

/** Pontos entre um bicho e o próximo: os marcos ficam à mesma distância, do primeiro ao fundo. */
export const STEP = 70;

/**
 * Os marcos da descida, um a cada `STEP` pontos: cada bicho na profundidade onde ele vive de verdade.
 * Quem passa por ele leva para a coleção. O último é o fundo da fossa, só com os 700 pontos.
 */
export const MILESTONES = (
  [
    {
      depth: 600,
      name: "Peixe-lanterna",
      art: "lanterna",
      fact: "Tem pontos de luz no corpo e sobe para comer de noite.",
    },
    {
      depth: 1000,
      name: "Lula-gigante",
      art: "lula",
      fact: "Tem o maior olho do reino animal, do tamanho de um prato.",
    },
    {
      depth: 1500,
      name: "Água-viva-coroa",
      art: "agua-viva",
      fact: "Quando é atacada, pisca em azul, como um alarme.",
    },
    {
      depth: 2000,
      name: "Cachalote",
      art: "cachalote",
      fact: "Desce mais de 2 mil metros sem respirar, caçando lulas.",
    },
    { depth: 3000, name: "Peixe-diabo", art: "diabo", fact: "A luz da isca vem de bactérias que moram nela." },
    {
      depth: 4000,
      name: "Polvo-dumbo",
      art: "dumbo",
      fact: "Nada batendo as nadadeiras que parecem orelhas de elefante.",
    },
    {
      depth: 5500,
      name: "Porquinho-do-mar",
      art: "porquinho",
      fact: "É um pepino-do-mar que anda pelo fundo com perninhas.",
    },
    {
      depth: 8000,
      name: "Peixe-caracol",
      art: "caracol",
      fact: "Mole e transparente, aguenta a pressão de 800 atmosferas.",
    },
    {
      depth: 9500,
      name: "Anfípode-gigante",
      art: "anfipode",
      fact: "Parente do camarão, digere até madeira que afunda.",
    },
    {
      depth: MAX_DEPTH,
      name: "Fundo da fossa",
      art: "fundo",
      fact: "O ponto mais fundo da Terra. Pouca gente já chegou aqui.",
    },
  ] as const
).map((m, i) => ({ ...m, art: m.art as MilestoneArt, points: (i + 1) * STEP }));

/**
 * Uma descida só, a rodada inteira: os pontos levam o submarino para baixo e ele nunca sobe. Entre
 * dois bichos a profundidade anda em linha reta; `MAX_POINTS` (700) é o fundo da fossa.
 */
export function depthAt(points: number): number {
  const p = Math.min(Math.max(points, 0), MAX_POINTS);
  const i = Math.min(MILESTONES.length - 1, Math.floor(p / STEP));
  const from = i ? MILESTONES[i - 1] : { points: 0, depth: 0 };
  const to = MILESTONES[i];
  return from.depth + ((p - from.points) / (to.points - from.points)) * (to.depth - from.depth);
}

/** O contrário de `depthAt`: os pontos que levam a uma profundidade (para acender a régua na descida). */
export function pointsAtDepth(depth: number): number {
  let from = { points: 0, depth: 0 };
  for (const to of MILESTONES) {
    if (depth <= to.depth)
      return from.points + ((depth - from.depth) / (to.depth - from.depth)) * (to.points - from.points);
    from = to;
  }
  return MAX_POINTS;
}

/** Quantos marcos os pontos alcançam (os primeiros `n` de MILESTONES). */
export const milestonesAt = (points: number) => MILESTONES.filter((m) => m.points <= points).length;

/** A camada do oceano numa profundidade (índice em ZONES). */
export const zoneAt = (depth: number) =>
  Math.max(
    0,
    ZONES.findIndex((z) => depth < z.to),
  );

/**
 * Zona da resposta na posição `index` (0 = a mais óbvia) de uma lista com `total` respostas. A
 * primeira fica sempre na superfície, mesmo numa lista curta.
 */
export function tierOf(index: number, total: number): number {
  if (index === 0) return 0;
  const fraction = (index + 1) / total;
  return TIERS.findIndex((t) => fraction <= t.upTo);
}

/** Posição da primeira resposta da última faixa: as raríssimas mais conhecidas começam aqui. */
export function rareStart(total: number): number {
  let i = 0;
  while (i < total - 1 && tierOf(i, total) < TIERS.length - 1) i++;
  return i;
}

export const pointsOf = (play: PlayView<unknown, IncomumFeedback>) =>
  play.guesses.reduce((sum, g) => sum + g.feedback.points, 0);

/** Segundos de oxigênio (de tempo) para cada mergulho. */
export const SECONDS = 25;

/** Tentativas especiais: pular a categoria e deixar o tempo acabar. Valem 0. */
export const SKIP = "(pular)";
export const TIMEOUT = "(tempo)";
