import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * O banco que os módulos do servidor recebem. É o tipo comum ao Postgres de produção (Neon) e ao
 * PGlite dos testes; uma transação também serve.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let db: Db | undefined;

/** Conexão com o Neon, criada no primeiro uso. Precisa de DATABASE_URL. */
export function getDb(): Db {
  db ??= drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema }) as unknown as Db;
  return db;
}

export { schema };
