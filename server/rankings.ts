import { and, eq, sql, type SQL } from "drizzle-orm";
import type { PlayStatus } from "@/games/types";
import { addDays, getDateKey, isDateKey } from "@/lib/daily/date";
import type { Db } from "./db";
import { dailyScores, groupMembers, plays, user } from "./db/schema";
import { AppError } from "./errors";
import { gameOf } from "./plays";

/**
 * Rankings: Score diário de um dia (ou a Nota de um jogo num dia), Média de 30 dias do Score diário
 * e Média de 30 dias da Nota de um jogo. Os números são os mesmos no geral e num Grupo; o Grupo só
 * filtra quem aparece (ADR 0002).
 */

export const WINDOW_DAYS = 30;

/** `daily` com `slug`: a Nota de um jogo (Modos inclusive) naquele dia. */
export type RankingKind =
  | { kind: "daily"; dateKey: string; slug?: string }
  | { kind: "rolling" }
  | { kind: "game"; slug: string };

export interface RankingRow {
  /** Ranking denso: valores iguais, posições iguais. */
  position: number;
  account: { id: string; handle: string; name: string; image: string | null; dev: boolean };
  /** Soma de Notas: o Score diário do dia, ou a soma da janela de 30 dias. */
  total: number;
  /** O que se mostra: o Score diário, ou a Média de 30 dias (total ÷ 30, uma casa). */
  value: number;
  /** Jogou no período. Só é falso no Ranking de um Grupo, que mostra todos os membros. */
  played: boolean;
  /**
   * Só no Ranking diário: o placar da partida (`playCount`), com `slug`; sem ele, quantos jogos
   * (Modos inclusive) terminou no dia. Null nos outros e em quem não jogou.
   */
  count: number | null;
  /** Só no Ranking diário de um jogo: como a partida terminou. */
  status: Exclude<PlayStatus, "playing"> | null;
}

export interface Ranking {
  rows: RankingRow[];
  /** A linha de quem pediu, mesmo fora das primeiras posições. */
  me: RankingRow | null;
  participants: number;
}

/** A janela da Média de 30 dias: os 30 dias corridos que terminam hoje, hoje incluído. */
export function windowOf(today: string) {
  return { from: addDays(today, -(WINDOW_DAYS - 1)), to: today };
}

/**
 * Linhas (account_id, total, reached, count, status) do período; `reached` desempata quem chegou
 * primeiro. A linha do Score diário existe desde a primeira partida do dia, Modo inclusive.
 */
function source(kind: RankingKind, today: string, members?: SQL): SQL {
  const only = (column: typeof dailyScores.accountId | typeof plays.accountId) => (members ? sql`and ${column} in (${members})` : sql``);
  if (kind.kind === "daily" && kind.slug) {
    return sql`select ${plays.accountId} as account_id, ${plays.nota} as total, ${plays.finishedAt} as reached,
        ${plays.count} as count, ${plays.status} as status
      from ${plays} where ${plays.slug} = ${kind.slug} and ${plays.dateKey} = ${kind.dateKey} ${only(plays.accountId)}`;
  }
  if (kind.kind === "daily") {
    const finished = sql`(select count(*) from ${plays}
      where ${plays.accountId} = ${dailyScores.accountId} and ${plays.dateKey} = ${dailyScores.dateKey})`;
    return sql`select ${dailyScores.accountId} as account_id, ${dailyScores.score} as total, ${dailyScores.updatedAt} as reached,
        ${finished} as count, null::text as status
      from ${dailyScores} where ${dailyScores.dateKey} = ${kind.dateKey} ${only(dailyScores.accountId)}`;
  }
  const { from, to } = windowOf(today);
  if (kind.kind === "rolling") {
    return sql`select ${dailyScores.accountId} as account_id, sum(${dailyScores.score}) as total, max(${dailyScores.updatedAt}) as reached,
        null::int as count, null::text as status
      from ${dailyScores} where ${dailyScores.dateKey} between ${from} and ${to} ${only(dailyScores.accountId)}
      group by ${dailyScores.accountId}`;
  }
  return sql`select ${plays.accountId} as account_id, sum(${plays.nota}) as total, max(${plays.finishedAt}) as reached,
      null::int as count, null::text as status
    from ${plays} where ${plays.slug} = ${kind.slug} and ${plays.dateKey} between ${from} and ${to} ${only(plays.accountId)}
    group by ${plays.accountId}`;
}

function validate(kind: RankingKind, today: string) {
  if (kind.kind === "daily" && (!isDateKey(kind.dateKey) || kind.dateKey > today)) {
    throw new AppError(400, "invalid_request", "Dia inválido");
  }
  if (kind.kind === "game" || (kind.kind === "daily" && kind.slug !== undefined)) gameOf(kind.slug);
}

interface RawRow {
  id: string;
  handle: string;
  name: string;
  image: string | null;
  dev: boolean;
  total: number;
  played: boolean;
  count: number | null;
  status: RankingRow["status"];
  position: number;
  participants: number;
}

export async function ranking(
  db: Db,
  kind: RankingKind,
  {
    groupId,
    accountId,
    limit = 100,
    now = new Date(),
    today = getDateKey(now),
  }: { groupId?: string; accountId?: string; limit?: number; now?: Date; today?: string },
): Promise<Ranking> {
  validate(kind, today);

  let query: SQL;
  if (groupId) {
    const [member] = accountId
      ? await db
          .select({ groupId: groupMembers.groupId })
          .from(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.accountId, accountId)))
      : [];
    if (!member) throw new AppError(403, "not_a_member", "Você não está neste Grupo");
    const members = sql`select ${groupMembers.accountId} from ${groupMembers} where ${groupMembers.groupId} = ${groupId}`;
    query = sql`
      with src as (${source(kind, today, members)}),
      ranked as (
        select u.id, u.handle, u.name, u.image, u.dev,
          coalesce(src.total, 0)::int as total,
          src.account_id is not null as played,
          src.count::int as count, src.status,
          dense_rank() over (order by coalesce(src.total, 0) desc)::int as position,
          row_number() over (order by coalesce(src.total, 0) desc, src.reached asc nulls last, u.handle) as rn,
          count(*) over ()::int as participants
        from ${groupMembers} m
        join ${user} u on u.id = m.account_id
        left join src on src.account_id = m.account_id
        where m.group_id = ${groupId}
      )
      select * from ranked where rn <= ${limit} or id = ${accountId ?? null} order by rn`;
  } else {
    query = sql`
      with src as (${source(kind, today)}),
      ranked as (
        select u.id, u.handle, u.name, u.image, u.dev,
          src.total::int as total,
          true as played,
          src.count::int as count, src.status,
          dense_rank() over (order by src.total desc)::int as position,
          row_number() over (order by src.total desc, src.reached asc, u.handle) as rn,
          count(*) over ()::int as participants
        from src join ${user} u on u.id = src.account_id
      )
      select * from ranked where rn <= ${limit} or id = ${accountId ?? null} order by rn`;
  }

  // Neon e PGlite devolvem { rows }; o tipo genérico do banco não sabe disso.
  const result = (await db.execute(query)) as unknown as { rows: RawRow[] };
  const all = result.rows.map(
    (r): RankingRow => ({
      position: r.position,
      account: { id: r.id, handle: r.handle, name: r.name, image: r.image, dev: r.dev },
      total: r.total,
      value: kind.kind === "daily" ? r.total : Math.round((r.total / WINDOW_DAYS) * 10) / 10,
      played: r.played,
      count: r.count,
      status: r.status,
    }),
  );
  const mine = all.find((r) => r.account.id === accountId) ?? null;
  return {
    rows: all.slice(0, limit),
    me: mine,
    participants: result.rows[0]?.participants ?? 0,
  };
}
