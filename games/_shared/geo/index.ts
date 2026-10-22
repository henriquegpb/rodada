import { normalize } from "@/lib/normalize";

/** Chave de comparação de nomes: sem acento, sem apóstrofo, hífen vira espaço ("Guiné-Bissau" = "guine bissau"). */
export const nameKey = (s: string) =>
  normalize(s)
    .replace(/['’]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
import data from "./countries.json";

export interface Country {
  code: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  continent: string;
  areaKm2: number;
  /** Grande o bastante para ser resposta do jogo de silhueta. */
  shapeEligible: boolean;
}

export const countries: readonly Country[] = data;

const byCode = new Map(countries.map((c) => [c.code, c]));

const byName = new Map<string, Country>();
for (const c of countries) {
  for (const n of [c.name, ...c.aliases]) byName.set(nameKey(n), c);
}

export function getCountry(code: string): Country | undefined {
  return byCode.get(code);
}

/**
 * Acha um país pelo nome, apelido ou código, ignorando acentos e maiúsculas.
 * `byCode: false` aceita só nome e apelido: no Mundo, digitar "Alemanha" passa por "al" (Albânia).
 */
export function findCountry(input: string, { byCode: withCode = true } = {}): Country | undefined {
  const key = nameKey(input);
  return byName.get(key) ?? (withCode ? byCode.get(key) : undefined);
}

/** Um começo de nome vale pelo país inteiro quando faltam no máximo estas letras… */
export const PREFIX_MAX_MISSING = 2;
/** …ou quando já foram digitadas pelo menos estas (nomes longos: "Estados Unidos"). */
export const PREFIX_MIN_TYPED = 8;

/**
 * Lê o que a pessoa já digitou, considerando só os países que ainda não foram achados.
 * - `match`: o texto só pode ser um país e está perto o bastante do nome: é o nome completo,
 *   faltam até PREFIX_MAX_MISSING letras, ou já tem PREFIX_MIN_TYPED letras. Pode aceitar na hora.
 * - `exact`: o texto é o nome completo de um país, mas também é o começo de outro
 *   ("Níger" / "Nigéria"). Só aceita com Enter.
 * - `open`: algum país restante ainda começa com esse texto.
 */
export function readPrefix(
  query: string,
  remaining: readonly Country[],
): { match?: Country; exact?: Country; open: boolean } {
  const q = nameKey(query);
  if (!q) return { open: false };
  const names = (c: Country) => [c.name, ...c.aliases].map(nameKey);
  const candidates = remaining.filter((c) => names(c).some((n) => n.startsWith(q)));
  const exact = candidates.find((c) => names(c).includes(q));
  if (candidates.length === 1) {
    const [only] = candidates;
    const close = names(only).some((n) => n.startsWith(q) && n.length - q.length <= PREFIX_MAX_MISSING);
    if (exact || close || q.length >= PREFIX_MIN_TYPED) return { match: only, open: true };
  }
  return { exact, open: candidates.length > 0 };
}

/** Sugestões do autocomplete: primeiro quem começa com o texto, depois quem contém. */
export function searchCountries(query: string, limit = 6): Country[] {
  const q = nameKey(query);
  if (!q) return [];
  const starts: Country[] = [];
  const contains: Country[] = [];
  for (const c of countries) {
    const names = [c.name, ...c.aliases].map(nameKey);
    if (names.some((n) => n.startsWith(q))) starts.push(c);
    else if (names.some((n) => n.includes(q))) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

const EARTH_RADIUS_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distância em km pelo grande círculo (haversine). */
export function distanceKm(a: Country, b: Country): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Rumo inicial de `a` para `b`, em graus a partir do norte (0–360). */
export function bearing(a: Country, b: Country): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO";
const DIRECTIONS: Direction[] = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

export function toDirection(deg: number): Direction {
  return DIRECTIONS[Math.round(deg / 45) % 8];
}

/** Ângulo da seta de cada direção, para girar um ícone que aponta para cima. */
export const DIRECTION_DEG: Record<Direction, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SO: 225, O: 270, NO: 315 };

export const DIRECTION_EMOJI: Record<Direction, string> = {
  N: "⬆️",
  NE: "↗️",
  E: "➡️",
  SE: "↘️",
  S: "⬇️",
  SO: "↙️",
  O: "⬅️",
  NO: "↖️",
};

/** Metade da circunferência da Terra: o mais longe que dois países podem estar. */
const MAX_DISTANCE_KM = 20_000;

/** 100% = acertou; 0% = do outro lado do planeta. */
export function proximity(km: number): number {
  return Math.max(0, Math.round(100 * (1 - km / MAX_DISTANCE_KM)));
}

export function formatDistance(km: number): string {
  return `${Math.round(km).toLocaleString("pt-BR")} km`;
}

/** Linha do compartilhamento: 5 quadrados de proximidade + seta (ou alvo, se acertou). */
export function proximityEmoji(g: { proximity: number; direction: Direction | null }): string {
  const filled = Math.floor(g.proximity / 20);
  return `${"🟧".repeat(filled)}${"⬛".repeat(5 - filled)} ${g.direction ? DIRECTION_EMOJI[g.direction] : "🎯"}`;
}
