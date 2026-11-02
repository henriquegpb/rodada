import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { engine as palavra } from "@/games/palavra/engine";
import { engine as dupla } from "@/games/dupla/engine";
import type { Db } from "./db";
import { dailyScores, plays } from "./db/schema";
import { createAccount, createTestDb } from "./db/testing";
import { importPlays, readCounters, recomputeScores, registerPlay, startTimedPlay } from "./plays";

const DAY = "2026-10-22";
/** Meio-dia em Brasília no DAY. */
const NOON = new Date(`${DAY}T15:00:00Z`);
const at = (iso: string) => new Date(iso);

const answerOf = (dateKey: string) => palavra.createChallenge(dateKey).answer;
const miss = (dateKey: string) => (answerOf(dateKey) === "sabia" ? "porta" : "sabia");

let db: Db;
let ana: string;

beforeEach(async () => {
  db = await createTestDb();
  ana = await createAccount(db, "ana");
});

describe("registerPlay", () => {
  it("refaz a partida, calcula a Nota e soma no Score diário", async () => {
    const receipt = await registerPlay(db, ana, { slug: "palavra", dateKey: DAY, guesses: [miss(DAY), answerOf(DAY)] }, NOON);
    expect(receipt.play).toMatchObject({ status: "won", count: 2, score: 5, nota: 83 });
    expect(receipt.daily).toEqual({ score: 83, roundFinished: 1 });
  });

  it("reenviar a mesma partida devolve o que já estava gravado, sem contar de novo", async () => {
    const play = { slug: "palavra", dateKey: DAY, guesses: [answerOf(DAY)] };
    await registerPlay(db, ana, play, NOON);
    const again = await registerPlay(db, ana, { ...play, guesses: [miss(DAY)] }, NOON);
    expect(again.play.nota).toBe(100);
    expect(again.daily.score).toBe(100);
    expect(again.levelUps).toEqual([]);
    expect((await readCounters(db, ana)).byGame.palavra.plays).toBe(1);
  });

  it("recusa chute que a engine recusa", async () => {
    await expect(registerPlay(db, ana, { slug: "palavra", dateKey: DAY, guesses: ["zzzzz"] }, NOON)).rejects.toMatchObject({
      status: 422,
      code: "invalid_play",
    });
  });

  it("partida que não terminou sozinha conta como desistência", async () => {
    const receipt = await registerPlay(db, ana, { slug: "palavra", dateKey: DAY, guesses: [miss(DAY)] }, NOON);
    expect(receipt.play).toMatchObject({ status: "lost", nota: 0 });
  });

  it("recusa jogo desconhecido e corpo inválido", async () => {
    await expect(registerPlay(db, ana, { slug: "xadrez", dateKey: DAY, guesses: [] }, NOON)).rejects.toMatchObject({ status: 400 });
    await expect(registerPlay(db, ana, { slug: "palavra", dateKey: "ontem", guesses: [] }, NOON)).rejects.toMatchObject({ status: 400 });
    await expect(registerPlay(db, ana, { slug: "palavra", dateKey: DAY, guesses: "x" }, NOON)).rejects.toMatchObject({ status: 400 });
  });

  it("só aceita a partida do dia, com alguns minutos de folga depois da meia-noite", async () => {
    const play = { slug: "palavra", dateKey: DAY, guesses: [answerOf(DAY)] };
    await expect(registerPlay(db, ana, play, at("2026-10-21T15:00:00Z"))).rejects.toMatchObject({ code: "closed_day" });
    await expect(registerPlay(db, ana, play, at("2026-10-23T03:10:00Z"))).rejects.toMatchObject({ code: "closed_day" });
    // 00:02 em Brasília do dia seguinte.
    await expect(registerPlay(db, ana, play, at("2026-10-23T03:02:00Z"))).resolves.toMatchObject({ play: { nota: 100 } });
  });

  it("Modo soma no Score diário, mas não conta para a Rodada completa", async () => {
    const { answer } = dupla.createChallenge(DAY);
    const receipt = await registerPlay(db, ana, { slug: "dupla", dateKey: DAY, guesses: answer as string[] }, NOON);
    expect(receipt.play.status).toBe("won");
    expect(receipt.play.nota).toBeGreaterThan(0);
    expect(receipt.daily).toEqual({ score: receipt.play.nota, roundFinished: 0 });
  });

  it("avisa as Conquistas que subiram de Nível", async () => {
    const receipt = await registerPlay(db, ana, { slug: "palavra", dateKey: DAY, guesses: [answerOf(DAY)] }, NOON);
    expect(receipt.levelUps.map((u) => [u.id, u.level])).toEqual([["perfeito-palavra", "bronze"]]);
  });
});

describe("relógio do Mundo", () => {
  it("recusa partida sem início registrado no servidor", async () => {
    await expect(registerPlay(db, ana, { slug: "mundo", dateKey: DAY, guesses: [] }, NOON)).rejects.toMatchObject({
      code: "not_started",
    });
  });

  it("aceita dentro do tempo e recusa depois do relógio estourar", async () => {
    const bia = await createAccount(db, "bia");
    await startTimedPlay(db, ana, { slug: "mundo", dateKey: DAY }, NOON);
    await startTimedPlay(db, bia, { slug: "mundo", dateKey: DAY }, NOON);
    const in14min = new Date(NOON.getTime() + 14 * 60_000);
    const in20min = new Date(NOON.getTime() + 20 * 60_000);
    const guesses = ["Brasil"];
    await expect(registerPlay(db, ana, { slug: "mundo", dateKey: DAY, guesses }, in14min)).resolves.toMatchObject({
      play: { status: "done", count: 1 },
    });
    await expect(registerPlay(db, bia, { slug: "mundo", dateKey: DAY, guesses }, in20min)).rejects.toMatchObject({
      code: "time_up",
    });
  });

  it("começar de novo mantém o primeiro início", async () => {
    const first = await startTimedPlay(db, ana, { slug: "mundo", dateKey: DAY }, NOON);
    const again = await startTimedPlay(db, ana, { slug: "mundo", dateKey: DAY }, new Date(NOON.getTime() + 60_000));
    expect(again.startedAt.getTime()).toBe(first.startedAt.getTime());
  });

  it("só jogos com tempo e só hoje", async () => {
    await expect(startTimedPlay(db, ana, { slug: "palavra", dateKey: DAY }, NOON)).rejects.toMatchObject({ code: "not_timed" });
    await expect(startTimedPlay(db, ana, { slug: "mundo", dateKey: "2026-10-21" }, NOON)).rejects.toMatchObject({
      code: "closed_day",
    });
  });
});

describe("importPlays", () => {
  const D1 = "2026-10-22";
  const D2 = "2026-10-23";
  const later = at("2026-10-25T15:00:00Z");

  it("importa partidas válidas de dias anteriores e recalcula os contadores", async () => {
    const result = await importPlays(
      db,
      ana,
      {
        plays: [
          { slug: "palavra", dateKey: D1, guesses: [answerOf(D1)] },
          { slug: "palavra", dateKey: D2, guesses: [miss(D2), answerOf(D2)] },
          { slug: "palavra", dateKey: D2, guesses: ["zzzzz"] }, // inválida
          { slug: "palavra", dateKey: "2026-12-01", guesses: [] }, // no futuro
          { slug: "palavra", dateKey: "2026-01-01", guesses: [] }, // antes da estreia
        ],
      },
      later,
    );
    expect(result).toEqual({ accepted: 2, rejected: 3 });
    expect(await readCounters(db, ana)).toMatchObject({ daysPlayed: 2, maxStreak: 2, byGame: { palavra: { plays: 2, perfect: 1 } } });
  });

  it("só uma vez por Conta", async () => {
    await importPlays(db, ana, { plays: [] }, later);
    await expect(importPlays(db, ana, { plays: [] }, later)).rejects.toMatchObject({ code: "already_imported" });
  });

  it("a partida já gravada no servidor prevalece", async () => {
    await registerPlay(db, ana, { slug: "palavra", dateKey: D1, guesses: [answerOf(D1)] }, NOON);
    const result = await importPlays(db, ana, { plays: [{ slug: "palavra", dateKey: D1, guesses: [miss(D1)] }] }, later);
    expect(result).toEqual({ accepted: 0, rejected: 1 });
    expect((await readCounters(db, ana)).byGame.palavra.perfect).toBe(1);
  });
});

describe("recomputeScores", () => {
  /** O que a regra antiga deixou gravado: Elo em 4 chutes valendo 70 e o Modo fora do Score diário. */
  async function oldRules() {
    const { answer } = dupla.createChallenge(DAY);
    const { play } = await registerPlay(db, ana, { slug: "dupla", dateKey: DAY, guesses: answer as string[] }, NOON);
    await db
      .insert(plays)
      .values({ accountId: ana, slug: "elo", dateKey: DAY, status: "won", count: 4, score: 7, nota: 70, guesses: [], finishedAt: NOON });
    await db.update(dailyScores).set({ score: 0 }).where(and(eq(dailyScores.accountId, ana), eq(dailyScores.dateKey, DAY)));
    return play.nota;
  }
  const scoreOfDay = async () =>
    (await db.select().from(dailyScores).where(and(eq(dailyScores.accountId, ana), eq(dailyScores.dateKey, DAY))))[0].score;
  const eloNota = async () => (await db.select().from(plays).where(eq(plays.slug, "elo")))[0].nota;

  it("sem apply só conta o que mudaria", async () => {
    await oldRules();
    expect(await recomputeScores(db, { now: NOON })).toEqual({ plays: { elo: 1 }, days: 1, accounts: 1 });
    expect(await eloNota()).toBe(70);
    expect(await scoreOfDay()).toBe(0);
  });

  it("com apply grava a Nota nova, o Score diário e as Conquistas", async () => {
    const duplaNota = await oldRules();
    await recomputeScores(db, { apply: true, now: NOON });
    expect(await eloNota()).toBe(100);
    expect(await scoreOfDay()).toBe(duplaNota + 100);
    expect((await readCounters(db, ana)).byGame.elo).toEqual({ plays: 1, perfect: 1 });
    expect(await recomputeScores(db, { now: NOON })).toEqual({ plays: {}, days: 0, accounts: 0 });
  });
});
