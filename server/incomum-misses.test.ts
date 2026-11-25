import { beforeEach, describe, expect, it } from "vitest";
import { engine, type IncomumAnswer } from "@/games/incomum/engine";
import type { Db } from "./db";
import { incomumMisses } from "./db/schema";
import { createTestDb } from "./db/testing";
import { recordMiss } from "./incomum-misses";

const DAY = "2026-11-25";
const NOON = new Date(`${DAY}T15:00:00Z`);
const firstCategory = () => (engine.createChallenge(DAY).answer as IncomumAnswer).categories[0];

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
});

describe("recordMiss", () => {
  it("soma a resposta recusada pela chave, guardando como a primeira pessoa escreveu", async () => {
    await recordMiss(db, { dateKey: DAY, index: 0, input: "Xyzzy Qwertz" }, NOON);
    await recordMiss(db, { dateKey: DAY, index: 0, input: "  xyzzy  QWERTZ " }, NOON);
    const rows = await db.select().from(incomumMisses);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ category: firstCategory().id, text: "Xyzzy Qwertz", count: 2 });
  });

  it("não guarda o que está na lista nem o que parece com uma resposta", async () => {
    const obvious = firstCategory().obvious;
    await recordMiss(db, { dateKey: DAY, index: 0, input: obvious }, NOON);
    // Uma letra trocada vira sugestão no jogo: não é o que falta.
    await recordMiss(db, { dateKey: DAY, index: 0, input: `${obvious}x` }, NOON);
    expect(await db.select().from(incomumMisses)).toEqual([]);
  });

  it("recusa dia e categoria inválidos", async () => {
    await expect(recordMiss(db, { dateKey: "2026-13-01", index: 0, input: "abc" }, NOON)).rejects.toMatchObject({ status: 400 });
    await expect(recordMiss(db, { dateKey: "2027-01-01", index: 0, input: "abc" }, NOON)).rejects.toMatchObject({ status: 400 });
    await expect(recordMiss(db, { dateKey: DAY, index: 7, input: "abc" }, NOON)).rejects.toMatchObject({ status: 400 });
    await expect(recordMiss(db, { dateKey: DAY, index: 0, input: 42 }, NOON)).rejects.toMatchObject({ status: 400 });
  });
});
