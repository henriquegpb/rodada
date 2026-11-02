import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { PlayStatus } from "@/games/types";
import type { Counters } from "@/lib/achievements";

/*
 * Tabelas do login (Better Auth). A chave de cada uma no objeto exportado é o nome que o
 * Better Auth procura (`user`, `session`, `account`, `verification`); o nome no banco é outro
 * para não confundir com a Conta nem usar a palavra reservada "user".
 */

/** A Conta: quem fez login. O id é o mesmo em todas as outras tabelas (`account_id`). */
export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  /** URL da foto de perfil (Vercel Blob ou a do Google). */
  image: text("image"),
  /** Sempre em minúsculas: [a-z0-9_], 3–20. Vira o endereço do Perfil. */
  handle: text("handle").notNull().unique(),
  bio: text("bio").notNull().default(""),
  /** Quando as Partidas do navegador foram importadas; a importação só acontece uma vez. */
  importedAt: timestamp("imported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Provedores de login ligados a uma Conta (Google, link mágico). */
export const account = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_accounts_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* Jogo */

const accountId = () =>
  text("account_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/** Uma Partida do dia terminada. Treinos nunca chegam aqui. */
export const plays = pgTable(
  "plays",
  {
    accountId: accountId(),
    slug: text("slug").notNull(),
    dateKey: text("date_key").notNull(),
    status: text("status").$type<Exclude<PlayStatus, "playing">>().notNull(),
    /** O placar da partida (`playCount`): tentativas, acertos, itens, pontos ou erros. */
    count: integer("count").notNull(),
    /** Score bruto (`scorePlay`). */
    score: integer("score").notNull(),
    /** 0–100 (`gradePlay`). */
    nota: integer("nota").notNull(),
    /** Só os `input` dos chutes; o feedback sai de refazer a partida. */
    guesses: jsonb("guesses").$type<string[]>().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.slug, t.dateKey] }), index("plays_slug_date_idx").on(t.slug, t.dateKey)],
);

/**
 * O dia de uma Conta: Score diário (soma das Notas de todos os jogos, Modos inclusive) e quantos
 * jogos da Rodada terminou. Existe desde que a Conta termine qualquer jogo no dia, inclusive um Modo.
 */
export const dailyScores = pgTable(
  "daily_scores",
  {
    accountId: accountId(),
    dateKey: text("date_key").notNull(),
    score: integer("score").notNull(),
    roundFinished: integer("round_finished").notNull(),
    /** A última partida do dia: desempata quem chegou primeiro ao mesmo valor. */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.dateKey] }), index("daily_scores_date_score_idx").on(t.dateKey, t.score)],
);

/** Contadores das Conquistas, recalculados a cada partida gravada. */
export const accountCounters = pgTable("account_counters", {
  accountId: accountId().primaryKey(),
  daysPlayed: integer("days_played").notNull(),
  maxStreak: integer("max_streak").notNull(),
  fullRounds: integer("full_rounds").notNull(),
  byGame: jsonb("by_game").$type<Counters["byGame"]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/** Início de um jogo com tempo pelo relógio do servidor. */
export const timedStarts = pgTable(
  "timed_starts",
  {
    accountId: accountId(),
    slug: text("slug").notNull(),
    dateKey: text("date_key").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.slug, t.dateKey] })],
);

/* Social */

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    accountId: accountId(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.accountId] }), index("group_members_account_idx").on(t.accountId)],
);
