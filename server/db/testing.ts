import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { fileURLToPath } from "node:url";
import type { Db } from "./index";
import * as schema from "./schema";

/** Um Postgres de verdade em memória (PGlite), com as mesmas migrações da produção. Só para testes. */
export async function createTestDb(): Promise<Db> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url)) });
  return db as unknown as Db;
}

/** Cria uma Conta direto no banco, como o login faria. */
export async function createAccount(db: Db, handle: string, createdAt = new Date("2026-10-01T12:00:00Z")) {
  await db.insert(schema.user).values({
    id: `id-${handle}`,
    name: handle,
    email: `${handle}@example.com`,
    handle,
    createdAt,
  });
  return `id-${handle}`;
}
