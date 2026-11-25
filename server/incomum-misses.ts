import { sql } from "drizzle-orm";
import { engine, findAnswer, itemsOf, type IncomumAnswer } from "@/games/incomum/engine";
import { answerKey } from "@/games/incomum/match";
import { ROUND } from "@/games/incomum/tiers";
import { addDays, getDateKey, isDateKey } from "@/lib/daily/date";
import type { Db } from "./db";
import { incomumMisses } from "./db/schema";
import { AppError } from "./errors";
import { readPublicFile } from "./public-files";

/** Resposta mais longa que isso é frase, não resposta: corta. */
const MAX_TEXT = 60;

/**
 * Soma uma resposta que o Incomum recusou: { dateKey, index, input }, com `index` a posição da
 * categoria no dia. O servidor confere de novo na lista daquele dia e só guarda o que de fato não
 * está nela (nem parecido), sem nada de quem digitou.
 */
export async function recordMiss(db: Db, input: unknown, now = new Date()): Promise<void> {
  const { dateKey, index, input: text } = (input ?? {}) as Record<string, unknown>;
  if (!isDateKey(dateKey) || dateKey > addDays(getDateKey(now), 1)) throw new AppError(400, "invalid_date", "Dia inválido");
  if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= ROUND) {
    throw new AppError(400, "invalid_index", "Categoria inválida");
  }
  if (typeof text !== "string") throw new AppError(400, "invalid_input", "Resposta inválida");
  const typed = text.trim().slice(0, MAX_TEXT);
  const key = answerKey(typed);
  if (key.length < 2) return;

  await engine.prepare?.(dateKey, readPublicFile);
  const ref = (engine.createChallenge(dateKey).answer as IncomumAnswer).categories[index as number];
  const items = itemsOf(ref);
  // Está na lista (ou parece com uma): não é o que falta.
  if (!items || findAnswer(items, typed)) return;

  await db
    .insert(incomumMisses)
    .values({ category: ref.id, key, text: typed, firstSeen: now, lastSeen: now })
    .onConflictDoUpdate({
      target: [incomumMisses.category, incomumMisses.key],
      set: { count: sql`${incomumMisses.count} + 1`, lastSeen: now },
    });
}
