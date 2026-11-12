import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { engine as palavra } from "@/games/palavra/engine";
import { deleteAccountAsAdmin } from "./accounts";
import type { Db } from "./db";
import { accountCounters, dailyScores, plays, user } from "./db/schema";
import { createAccount, createTestDb } from "./db/testing";
import { createGroup, getGroup, joinGroup } from "./groups";
import { registerPlay } from "./plays";

const D1 = "2026-10-22";
const win = { slug: "palavra", dateKey: D1, guesses: [palavra.createChallenge(D1).answer] };

let db: Db;
let admin: string;
let dev: string;
let ana: string;
let bia: string;

beforeEach(async () => {
  db = await createTestDb();
  admin = await createAccount(db, "admin");
  dev = await createAccount(db, "dev");
  ana = await createAccount(db, "ana");
  bia = await createAccount(db, "bia");
  await db.update(user).set({ admin: true }).where(eq(user.id, admin));
  await db.update(user).set({ dev: true }).where(eq(user.id, dev));
});

describe("exclusão de Conta por Admin", () => {
  it("apaga a Conta e tudo dela; os Grupos passam adiante", async () => {
    await db.update(user).set({ image: "https://x.blob.vercel-storage.com/a.png" }).where(eq(user.id, ana));
    await registerPlay(db, ana, win, new Date(`${D1}T15:00:00Z`));
    const group = await createGroup(db, ana, { name: "Família" });
    await joinGroup(db, bia, { code: group.inviteCode });

    expect(await deleteAccountAsAdmin(db, admin, ana)).toEqual({ image: "https://x.blob.vercel-storage.com/a.png" });

    expect(await db.select().from(user).where(eq(user.id, ana))).toEqual([]);
    expect(await db.select().from(plays).where(eq(plays.accountId, ana))).toEqual([]);
    expect(await db.select().from(dailyScores).where(eq(dailyScores.accountId, ana))).toEqual([]);
    expect(await db.select().from(accountCounters).where(eq(accountCounters.accountId, ana))).toEqual([]);
    const detail = await getGroup(db, bia, group.id);
    expect(detail.members.map((m) => m.handle)).toEqual(["bia"]);
  });

  it("quem não é Admin recebe 403 e nada sai, nem quem é só Dev", async () => {
    await expect(deleteAccountAsAdmin(db, bia, ana)).rejects.toMatchObject({ status: 403 });
    await expect(deleteAccountAsAdmin(db, dev, ana)).rejects.toMatchObject({ status: 403 });
    expect(await db.select().from(user).where(eq(user.id, ana))).toHaveLength(1);
  });

  it("não exclui a própria Conta por aqui", async () => {
    await expect(deleteAccountAsAdmin(db, admin, admin)).rejects.toMatchObject({ status: 400 });
  });

  it("Conta inexistente é 404", async () => {
    await expect(deleteAccountAsAdmin(db, admin, "id-ninguem")).rejects.toMatchObject({ status: 404 });
  });
});
