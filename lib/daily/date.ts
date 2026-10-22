/** Fuso que define a virada do desafio. */
export const TIMEZONE = "America/Sao_Paulo";

/** Primeiro dia do Rodada: o desafio desta data é o #1. */
export const EPOCH_DATE = "2026-10-22";

const DAY_MS = 86_400_000;

/** Data atual (YYYY-MM-DD) no fuso do desafio. */
export function getDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const toUtcMs = (dateKey: string) => Date.parse(`${dateKey}T00:00:00Z`);

export function addDays(dateKey: string, days: number): string {
  return new Date(toUtcMs(dateKey) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Diferença em dias corridos entre duas datas (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

/** Número sequencial do desafio: #1 em EPOCH_DATE. */
export function challengeNumber(dateKey: string): number {
  return daysBetween(EPOCH_DATE, dateKey) + 1;
}

/** Deslocamento do fuso em ms (local − UTC) num instante. */
function zoneOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Instante (ms UTC) da meia-noite de `dateKey` no fuso do desafio. */
export function zonedMidnight(dateKey: string): number {
  const guess = toUtcMs(dateKey);
  return guess - zoneOffsetMs(guess - zoneOffsetMs(guess));
}

/** Milissegundos até o próximo desafio. */
export function msUntilNextChallenge(now: Date = new Date()): number {
  return zonedMidnight(addDays(getDateKey(now), 1)) - now.getTime();
}
