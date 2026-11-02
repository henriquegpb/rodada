import { and, eq, sql } from "drizzle-orm";
import { getGame, roundGames } from "@/games";
import { loadEngine } from "@/games/engines";
import type { GameDefinition, PlayStatus } from "@/games/types";
import { EMPTY_COUNTERS, levelUps, type Counters, type Level } from "@/lib/achievements";
import { EPOCH_DATE, addDays, getDateKey, isDateKey, zonedMidnight } from "@/lib/daily/date";
import { replayPlay } from "@/lib/plays/replay";
import { gradePlay, scorePlay } from "@/lib/scoring";
import { computeStreak } from "@/lib/stats";
import type { Db } from "./db";
import { accountCounters, dailyScores, plays, timedStarts, user } from "./db/schema";
import { AppError } from "./errors";

/**
 * Registro de partidas: recebe os chutes de uma Partida do dia terminada, refaz a partida com a
 * engine (ADR 0001), calcula a Nota e grava, junto com o Score diário e os contadores das
 * Conquistas, numa transação só.
 */

/** Os jogos que somam no Score diário; os Modos ficam de fora. */
export const ROUND_SLUGS = roundGames.map((g) => g.meta.slug);

/** Quem termina às 23:59 ainda consegue enviar a partida de ontem por alguns minutos. */
const MIDNIGHT_GRACE_MS = 5 * 60_000;

/** Folga para a rede entre o fim do relógio na tela e o envio chegar. */
const CLOCK_GRACE_MS = 60_000;

const MAX_GUESSES = 1000;
const MAX_IMPORT = 5000;

/** Quantos jogos da Rodada existiam num dia: um jogo novo não tira a Rodada completa dos dias antigos. */
const roundSizeOn = (dateKey: string) => roundGames.filter((g) => (g.meta.launchedOn ?? EPOCH_DATE) <= dateKey).length;

export interface PlaySubmission {
  slug: string;
  dateKey: string;
  /** Os `input` dos chutes, na ordem. Uma partida que não terminou sozinha conta como desistência. */
  guesses: string[];
}

export interface RecordedPlay {
  slug: string;
  dateKey: string;
  status: Exclude<PlayStatus, "playing">;
  count: number;
  score: number;
  nota: number;
}

export interface PlayReceipt {
  play: RecordedPlay;
  daily: { score: number; roundFinished: number };
  /** Conquistas que subiram de Nível com esta partida. */
  levelUps: { id: string; name: string; level: Level }[];
}

export function gameOf(slug: unknown): GameDefinition {
  const game = typeof slug === "string" ? getGame(slug) : undefined;
  if (!game) throw new AppError(400, "unknown_game", "Jogo desconhecido");
  return game;
}

function parseSubmission(input: unknown): PlaySubmission {
  const { slug, dateKey, guesses } = (input ?? {}) as Partial<PlaySubmission>;
  if (typeof slug !== "string" || !isDateKey(dateKey)) {
    throw new AppError(400, "invalid_request", "Envie slug, dateKey (AAAA-MM-DD) e guesses");
  }
  if (!Array.isArray(guesses) || guesses.length > MAX_GUESSES || guesses.some((g) => typeof g !== "string")) {
    throw new AppError(400, "invalid_request", "guesses deve ser uma lista de textos");
  }
  return { slug, dateKey, guesses };
}

/** O dia ainda aceita partidas: é hoje, ou é ontem e a meia-noite acabou de passar. */
function isOpenDay(dateKey: string, now: Date): boolean {
  const today = getDateKey(now);
  if (dateKey === today) return true;
  return dateKey === addDays(today, -1) && now.getTime() - zonedMidnight(today) <= MIDNIGHT_GRACE_MS;
}

/** Refaz a partida e chega ao resultado. Toda partida enviada é final: se não terminou, desistiu. */
async function grade(game: GameDefinition, submission: PlaySubmission): Promise<RecordedPlay> {
  const { rules } = game.meta;
  const engine = await loadEngine(submission.slug);
  const { puzzle, answer } = engine.createChallenge(submission.dateKey);
  const replay = replayPlay(engine, rules, answer, submission.guesses, true);
  if (!replay.ok) throw new AppError(422, "invalid_play", replay.error);
  return {
    slug: submission.slug,
    dateKey: submission.dateKey,
    status: replay.status,
    count: replay.count,
    score: scorePlay(rules, replay.status, replay.count),
    nota: gradePlay(rules, replay.status, replay.count, engine.maxPoints?.(puzzle)),
  };
}

const inRound = (column: typeof plays.slug) =>
  sql`${column} in (${sql.join(
    ROUND_SLUGS.map((s) => sql`${s}`),
    sql`, `,
  )})`;

/**
 * Refaz o Score diário de um dia a partir das partidas gravadas. `updated_at` é a última partida da
 * Rodada (desempate de quem chegou primeiro); um Modo jogado depois não empurra ninguém para trás.
 */
async function refreshDay(db: Db, accountId: string, dateKey: string) {
  await db.execute(sql`
    insert into ${dailyScores} (account_id, date_key, score, round_finished, updated_at)
    select ${accountId}, ${dateKey},
      coalesce(sum(${plays.nota}) filter (where ${inRound(plays.slug)}), 0)::int,
      (count(*) filter (where ${inRound(plays.slug)}))::int,
      coalesce(max(${plays.finishedAt}) filter (where ${inRound(plays.slug)}), max(${plays.finishedAt}))
    from ${plays}
    where ${plays.accountId} = ${accountId} and ${plays.dateKey} = ${dateKey}
    on conflict (account_id, date_key) do update
      set score = excluded.score, round_finished = excluded.round_finished, updated_at = excluded.updated_at
  `);
}

export async function readCounters(db: Db, accountId: string): Promise<Counters> {
  const [row] = await db.select().from(accountCounters).where(eq(accountCounters.accountId, accountId));
  if (!row) return EMPTY_COUNTERS;
  return { daysPlayed: row.daysPlayed, maxStreak: row.maxStreak, fullRounds: row.fullRounds, byGame: row.byGame };
}

/**
 * Recalcula os contadores das Conquistas a partir do histórico. São duas consultas pequenas por
 * Conta e aguentam partidas importadas fora de ordem, o que um contador incremental não aguentaria.
 */
async function refreshCounters(db: Db, accountId: string, now: Date): Promise<Counters> {
  const games = await db
    .select({
      slug: plays.slug,
      plays: sql<number>`count(*)::int`,
      perfect: sql<number>`(count(*) filter (where ${plays.nota} = 100))::int`,
    })
    .from(plays)
    .where(eq(plays.accountId, accountId))
    .groupBy(plays.slug);
  const days = await db
    .select({ dateKey: dailyScores.dateKey, roundFinished: dailyScores.roundFinished })
    .from(dailyScores)
    .where(eq(dailyScores.accountId, accountId));

  const counters: Counters = {
    daysPlayed: days.length,
    maxStreak: computeStreak(new Map(days.map((d) => [d.dateKey, true])), getDateKey(now)).max,
    fullRounds: days.filter((d) => d.roundFinished >= roundSizeOn(d.dateKey)).length,
    byGame: Object.fromEntries(games.map((g) => [g.slug, { plays: g.plays, perfect: g.perfect }])),
  };
  await db
    .insert(accountCounters)
    .values({ accountId, ...counters, updatedAt: now })
    .onConflictDoUpdate({ target: accountCounters.accountId, set: { ...counters, updatedAt: now } });
  return counters;
}

/** Trava a linha da Conta até o fim da transação; serializa as escritas de uma mesma Conta. */
export async function lockAccount(db: Db, accountId: string) {
  const [account] = await db.select({ importedAt: user.importedAt }).from(user).where(eq(user.id, accountId)).for("update");
  if (!account) throw new AppError(404, "not_found", "Conta não encontrada");
  return account;
}

async function findPlay(db: Db, accountId: string, slug: string, dateKey: string): Promise<RecordedPlay | undefined> {
  const [row] = await db
    .select()
    .from(plays)
    .where(and(eq(plays.accountId, accountId), eq(plays.slug, slug), eq(plays.dateKey, dateKey)));
  return row && { slug, dateKey, status: row.status, count: row.count, score: row.score, nota: row.nota };
}

async function receipt(db: Db, accountId: string, play: RecordedPlay, ups: PlayReceipt["levelUps"]): Promise<PlayReceipt> {
  const [day] = await db
    .select({ score: dailyScores.score, roundFinished: dailyScores.roundFinished })
    .from(dailyScores)
    .where(and(eq(dailyScores.accountId, accountId), eq(dailyScores.dateKey, play.dateKey)));
  return { play, daily: day ?? { score: 0, roundFinished: 0 }, levelUps: ups };
}

/**
 * Grava uma Partida do dia terminada. Reenviar a mesma partida (rede instável, duas abas) devolve
 * o que já estava gravado, sem contar de novo.
 */
export async function registerPlay(db: Db, accountId: string, input: unknown, now = new Date()): Promise<PlayReceipt> {
  const submission = parseSubmission(input);
  const game = gameOf(submission.slug);
  const { slug, dateKey } = submission;

  const existing = await findPlay(db, accountId, slug, dateKey);
  if (existing) return receipt(db, accountId, existing, []);

  const { rules } = game.meta;
  if (rules.type === "timed") {
    const [start] = await db
      .select()
      .from(timedStarts)
      .where(and(eq(timedStarts.accountId, accountId), eq(timedStarts.slug, slug), eq(timedStarts.dateKey, dateKey)));
    if (!start) throw new AppError(409, "not_started", "O relógio desta partida não foi iniciado no servidor");
    if (now.getTime() > start.startedAt.getTime() + rules.seconds * 1000 + CLOCK_GRACE_MS) {
      throw new AppError(409, "time_up", "O tempo acabou antes de a partida ser enviada");
    }
  } else if (!isOpenDay(dateKey, now)) {
    throw new AppError(409, "closed_day", "Só dá para enviar a partida do dia");
  }

  const play = await grade(game, submission);
  return db.transaction(async (tx) => {
    // Uma partida da Conta por vez: duas abas enviando juntas não perdem Nota no Score diário.
    await lockAccount(tx, accountId);
    const before = await readCounters(tx, accountId);
    const inserted = await tx
      .insert(plays)
      .values({ accountId, ...play, guesses: submission.guesses, finishedAt: now })
      .onConflictDoNothing()
      .returning({ slug: plays.slug });
    if (inserted.length === 0) return receipt(tx, accountId, (await findPlay(tx, accountId, slug, dateKey))!, []);
    await refreshDay(tx, accountId, dateKey);
    const after = await refreshCounters(tx, accountId, now);
    return receipt(tx, accountId, play, levelUps(before, after));
  });
}

/** Jogos com tempo: o relógio passa a valer pelo servidor. Chamar de novo devolve o mesmo início. */
export async function startTimedPlay(db: Db, accountId: string, input: unknown, now = new Date()): Promise<{ startedAt: Date }> {
  const { slug, dateKey } = (input ?? {}) as { slug?: unknown; dateKey?: unknown };
  const game = gameOf(slug);
  if (game.meta.rules.type !== "timed") throw new AppError(400, "not_timed", "Este jogo não tem relógio");
  if (typeof dateKey !== "string" || dateKey !== getDateKey(now)) {
    throw new AppError(409, "closed_day", "Só dá para começar a partida de hoje");
  }
  await db
    .insert(timedStarts)
    .values({ accountId, slug: game.meta.slug, dateKey, startedAt: now })
    .onConflictDoNothing();
  const [start] = await db
    .select({ startedAt: timedStarts.startedAt })
    .from(timedStarts)
    .where(and(eq(timedStarts.accountId, accountId), eq(timedStarts.slug, game.meta.slug), eq(timedStarts.dateKey, dateKey)));
  return start;
}

export interface ImportItem extends PlaySubmission {
  /** Quando terminou (ISO); sem ele, agora. */
  finishedAt?: string;
}

/**
 * Importa, uma única vez por Conta, as Partidas do dia guardadas no navegador. Cada uma é refeita
 * pela engine; as que não passam são ignoradas. Partidas com tempo entram como vieram, porque não
 * há relógio do servidor para elas. Se a Conta já tem a partida, a do servidor fica.
 */
export async function importPlays(db: Db, accountId: string, input: unknown, now = new Date()) {
  const items = (input as { plays?: unknown })?.plays;
  if (!Array.isArray(items) || items.length > MAX_IMPORT) {
    throw new AppError(400, "invalid_request", `Envie plays: uma lista de até ${MAX_IMPORT} partidas`);
  }
  const today = getDateKey(now);

  return db.transaction(async (tx) => {
    const account = await lockAccount(tx, accountId);
    if (account.importedAt) throw new AppError(409, "already_imported", "As partidas deste navegador já foram importadas");
    await tx.update(user).set({ importedAt: now }).where(eq(user.id, accountId));

    let accepted = 0;
    const dates = new Set<string>();
    for (const item of items as ImportItem[]) {
      let play: RecordedPlay;
      try {
        const submission = parseSubmission(item);
        const game = gameOf(submission.slug);
        const launched = game.meta.launchedOn ?? EPOCH_DATE;
        if (submission.dateKey < launched || submission.dateKey > today) continue;
        play = await grade(game, submission);
      } catch {
        continue;
      }
      const finished = item.finishedAt ? new Date(item.finishedAt) : now;
      const finishedAt = Number.isNaN(finished.getTime()) || finished > now ? now : finished;
      const inserted = await tx
        .insert(plays)
        .values({ accountId, ...play, guesses: item.guesses, finishedAt })
        .onConflictDoNothing()
        .returning({ slug: plays.slug });
      if (inserted.length === 0) continue;
      accepted++;
      dates.add(play.dateKey);
    }
    for (const dateKey of dates) await refreshDay(tx, accountId, dateKey);
    if (dates.size) await refreshCounters(tx, accountId, now);
    return { accepted, rejected: items.length - accepted };
  });
}
