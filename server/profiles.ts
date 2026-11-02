import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { achievementProgress, type AchievementProgress } from "@/lib/achievements";
import { getDateKey } from "@/lib/daily/date";
import { normalize } from "@/lib/normalize";
import { overallStreak, type PlayRecord, type Streak } from "@/lib/stats";
import type { Db } from "./db";
import { plays, user } from "./db/schema";
import { AppError } from "./errors";
import { readCounters } from "./plays";
import { ranking } from "./rankings";

/** Perfil: a página pública de uma Conta, e a edição do próprio. */

const HANDLE = /^[a-z0-9_]{3,20}$/;
const MAX_NAME = 50;
const MAX_BIO = 160;

export interface Profile {
  account: { id: string; handle: string; name: string; bio: string; image: string | null; dev: boolean; createdAt: Date };
  streak: Streak;
  daysPlayed: number;
  /** Média de 30 dias e posição no Ranking geral; null se não jogou na janela. */
  rolling: { value: number; position: number; participants: number } | null;
  achievements: AchievementProgress[];
  /** Partidas do dia, no formato das estatísticas (`gameStats`, `HistoryGrid`). */
  records: PlayRecord[];
}

/** Um handle livre a partir do nome ou do e-mail, para a Conta já nascer com um; dá para trocar depois. */
export async function uniqueHandle(db: Db, name: string, email: string): Promise<string> {
  const fromName = normalize(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const fromEmail = normalize(email.split("@")[0]).replace(/[^a-z0-9_]+/g, "");
  let base = (fromName.length >= 3 ? fromName : fromEmail).slice(0, 15);
  if (base.length < 3) base = "jogador";
  for (let attempt = 0; attempt < 20; attempt++) {
    const handle = attempt === 0 ? base : `${base}_${randomInt(1000, 99999)}`;
    const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.handle, handle));
    if (!taken) return handle;
  }
  throw new AppError(500, "handle_unavailable", "Não deu para gerar um handle");
}

const cleanHandle = (handle: unknown) => (typeof handle === "string" ? handle.trim().toLowerCase().replace(/^@/, "") : "");

/** Para avisar enquanto a pessoa digita: o handle é válido e está livre (o próprio conta como livre)? */
export async function handleAvailability(db: Db, handle: string, accountId?: string) {
  const value = cleanHandle(handle);
  if (!HANDLE.test(value)) return { handle: value, valid: false, available: false };
  const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.handle, value));
  return { handle: value, valid: true, available: !owner || owner.id === accountId };
}

export async function updateProfile(db: Db, accountId: string, input: unknown) {
  const { handle, name, bio } = (input ?? {}) as { handle?: unknown; name?: unknown; bio?: unknown };
  const changes: { handle?: string; name?: string; bio?: string; updatedAt: Date } = { updatedAt: new Date() };

  if (handle !== undefined) {
    const check = await handleAvailability(db, cleanHandle(handle), accountId);
    if (!check.valid) throw new AppError(400, "invalid_handle", "O handle precisa ter de 3 a 20 letras, números ou _");
    if (!check.available) throw new AppError(409, "handle_taken", "Esse handle já está em uso");
    changes.handle = check.handle;
  }
  if (name !== undefined) {
    const value = typeof name === "string" ? name.trim() : "";
    if (!value || value.length > MAX_NAME) throw new AppError(400, "invalid_name", `O nome precisa ter de 1 a ${MAX_NAME} caracteres`);
    changes.name = value;
  }
  if (bio !== undefined) {
    const value = typeof bio === "string" ? bio.trim() : "";
    if (value.length > MAX_BIO) throw new AppError(400, "invalid_bio", `A bio tem no máximo ${MAX_BIO} caracteres`);
    changes.bio = value;
  }

  try {
    const [row] = await db.update(user).set(changes).where(eq(user.id, accountId)).returning();
    return { handle: row.handle, name: row.name, bio: row.bio, image: row.image };
  } catch (error) {
    // Dois pedidos pelo mesmo handle ao mesmo tempo: o índice único decide.
    if (changes.handle) throw new AppError(409, "handle_taken", "Esse handle já está em uso");
    throw error;
  }
}

/** Troca a foto e devolve a anterior, para apagar do armazenamento. */
export async function setImage(db: Db, accountId: string, image: string): Promise<string | null> {
  const [previous] = await db.select({ image: user.image }).from(user).where(eq(user.id, accountId));
  await db.update(user).set({ image, updatedAt: new Date() }).where(eq(user.id, accountId));
  return previous?.image ?? null;
}

/** O próprio Perfil, com o que só a Conta vê. */
export async function getMe(db: Db, accountId: string, now = new Date()) {
  const [account] = await db
    .select({ handle: user.handle, email: user.email, importedAt: user.importedAt })
    .from(user)
    .where(eq(user.id, accountId));
  if (!account) throw new AppError(404, "not_found", "Conta não encontrada");
  return { ...(await getProfile(db, account.handle, now)), email: account.email, importedAt: account.importedAt };
}

export async function getProfile(db: Db, handle: string, now = new Date()): Promise<Profile> {
  const [account] = await db
    .select({
      id: user.id,
      handle: user.handle,
      name: user.name,
      bio: user.bio,
      image: user.image,
      dev: user.dev,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.handle, handle.toLowerCase()));
  if (!account) throw new AppError(404, "not_found", "Perfil não encontrado");

  const [records, counters, rolling] = await Promise.all([
    db
      .select({ slug: plays.slug, dateKey: plays.dateKey, status: plays.status, count: plays.count })
      .from(plays)
      .where(eq(plays.accountId, account.id)),
    readCounters(db, account.id),
    ranking(db, { kind: "rolling" }, { accountId: account.id, limit: 0, now }),
  ]);

  return {
    account,
    streak: overallStreak(records, getDateKey(now)),
    daysPlayed: counters.daysPlayed,
    rolling: rolling.me && { value: rolling.me.value, position: rolling.me.position, participants: rolling.participants },
    achievements: achievementProgress(counters),
    records,
  };
}
