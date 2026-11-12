import type { Guess } from "../types";
import type { OrdemCategory, OrdemFeedback, OrdemMark } from "./types";

/*
 * O que o tabuleiro e a engine dividem. Não tem dado de resposta: pode ir para o navegador.
 */

export const COLOR = "#d94f8c";

/** Quantos países por dia. */
export const SIZE = 5;

/** Separador dos códigos na tentativa: "ru,br,ar,co,pt". */
export const SEPARATOR = ",";

export const encodeOrder = (codes: readonly string[]) => codes.join(SEPARATOR);

const number = (value: number, digits = 1) => value.toLocaleString("pt-BR", { maximumFractionDigits: digits });

/** "17.098.246" km² → "17,1 mi km²"; "92.212" → "92 mil km²"; "316" → "316 km²". */
export function formatArea(km2: number): string {
  if (km2 >= 1_000_000) return `${number(km2 / 1_000_000)} mi km²`;
  if (km2 >= 1_000) return `${Math.round(km2 / 1_000).toLocaleString("pt-BR")} mil km²`;
  return `${Math.round(km2).toLocaleString("pt-BR")} km²`;
}

/** 212.812.405 → "212,8 milhões"; 1.438.069.596 → "1,44 bilhão"; 843.000 → "843 mil". */
export function formatPeople(n: number): string {
  if (n >= 1e9) return `${number(n / 1e9, 2)} ${n < 2e9 ? "bilhão" : "bilhões"}`;
  if (n >= 1e6) return `${number(n / 1e6)} ${n < 2e6 ? "milhão" : "milhões"}`;
  if (n >= 1e3) return `${Math.round(n / 1e3).toLocaleString("pt-BR")} mil`;
  return Math.round(n).toLocaleString("pt-BR");
}

/** Dólares: "US$ 2,28 tri", "US$ 450 bi", "US$ 12,3 bi", "US$ 10.713". */
export function formatDollars(n: number): string {
  if (n >= 1e12) return `US$ ${number(n / 1e12, 2)} tri`;
  if (n >= 1e9) return `US$ ${number(n / 1e9, n >= 1e11 ? 0 : 1)} bi`;
  if (n >= 1e6) return `US$ ${number(n / 1e6, 0)} mi`;
  return `US$ ${Math.round(n).toLocaleString("pt-BR")}`;
}

export interface CategoryInfo {
  /** O nome da categoria, grande no topo do tabuleiro. */
  label: string;
  /** A frase que diz a direção da lista. */
  direction: string;
  /** O rótulo em cima e embaixo da lista. */
  top: string;
  bottom: string;
  /** Para o texto compartilhado. */
  emoji: string;
  format(value: number): string;
}

/** As categorias, na ordem em que aparecem no Como jogar. */
export const CATEGORIES: Record<OrdemCategory, CategoryInfo> = {
  area: {
    label: "Área",
    direction: "Do maior território para o menor",
    top: "Maior",
    bottom: "Menor",
    emoji: "🗺️",
    format: formatArea,
  },
  population: {
    label: "População",
    direction: "Do mais populoso para o menos populoso",
    top: "Mais gente",
    bottom: "Menos gente",
    emoji: "👥",
    format: formatPeople,
  },
  gdp: {
    label: "PIB",
    direction: "Da maior economia para a menor, em dólares",
    top: "PIB maior",
    bottom: "PIB menor",
    emoji: "💰",
    format: formatDollars,
  },
  gdpPerCapita: {
    label: "PIB por pessoa",
    direction: "Do mais rico por habitante para o menos rico",
    top: "Mais rico",
    bottom: "Menos rico",
    emoji: "💵",
    format: formatDollars,
  },
  density: {
    label: "Densidade",
    direction: "Do mais apertado para o mais vazio, em habitantes por km²",
    top: "Mais denso",
    bottom: "Menos denso",
    emoji: "🏙️",
    format: (v) => `${number(v, v < 10 ? 1 : 0)} hab/km²`,
  },
  lifeExpectancy: {
    label: "Expectativa de vida",
    direction: "De onde se vive mais para onde se vive menos",
    top: "Vive mais",
    bottom: "Vive menos",
    emoji: "❤️",
    format: (v) => `${number(v)} anos`,
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as OrdemCategory[];

export const MARK_EMOJI: Record<OrdemMark, string> = { correct: "🟩", wrong: "⬛" };

/** As posições que já estão certas na última tentativa. */
export function lockedPositions(guesses: readonly Guess<OrdemFeedback>[]): boolean[] {
  const last = guesses.at(-1)?.feedback;
  return Array.from({ length: SIZE }, (_, i) => last?.marks[i] === "correct");
}
