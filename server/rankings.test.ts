import { beforeEach, describe, expect, it } from "vitest";
import { engine as dupla } from "@/games/dupla/engine";
import { engine as palavra } from "@/games/palavra/engine";
import { addDays } from "@/lib/daily/date";
import type { Db } from "./db";
import { createAccount, createTestDb } from "./db/testing";
import { createGroup, joinGroup } from "./groups";
import { registerPlay } from "./plays";
import { ranking } from "./rankings";

const D1 = "2026-10-22";
const D2 = "2026-10-23";
const noon = (dateKey: string, minutes = 0) => new Date(Date.parse(`${dateKey}T15:00:00Z`) + minutes * 60_000);

const answerOf = (dateKey: string) => palavra.createChallenge(dateKey).answer;

/** Palavra do dia em `tries` tentativas (Nota 100, 83, 67…). */
function palavraIn(tries: number, dateKey: string) {
  const misses = ["sabia", "porta", "mundo", "carta", "festa"].filter((w) => w !== answerOf(dateKey)).slice(0, tries - 1);
  return { slug: "palavra", dateKey, guesses: [...misses, answerOf(dateKey)] };
}

let db: Db;
let ana: string;
let bia: string;
let caio: string;

beforeEach(async () => {
  db = await createTestDb();
  [ana, bia, caio] = await Promise.all(["ana", "bia", "caio"].map((h) => createAccount(db, h)));
});

const handles = (rows: { account: { handle: string } }[]) => rows.map((r) => r.account.handle);

describe("Ranking diário", () => {
  it("ordena pelo Score diário, com empate na mesma posição e quem chegou antes na frente", async () => {
    await registerPlay(db, bia, palavraIn(1, D1), noon(D1, 10));
    await registerPlay(db, ana, palavraIn(1, D1), noon(D1, 5));
    await registerPlay(db, caio, palavraIn(3, D1), noon(D1));

    const result = await ranking(db, { kind: "daily", dateKey: D1 }, { now: noon(D1, 30) });
    expect(handles(result.rows)).toEqual(["ana", "bia", "caio"]);
    expect(result.rows.map((r) => [r.position, r.value])).toEqual([
      [1, 100],
      [1, 100],
      [2, 67],
    ]);
    expect(result.participants).toBe(3);
  });

  it("mostra a linha de quem pediu mesmo fora do limite", async () => {
    await registerPlay(db, ana, palavraIn(1, D1), noon(D1));
    await registerPlay(db, bia, palavraIn(2, D1), noon(D1));
    await registerPlay(db, caio, palavraIn(3, D1), noon(D1));
    const result = await ranking(db, { kind: "daily", dateKey: D1 }, { accountId: caio, limit: 1, now: noon(D1, 30) });
    expect(handles(result.rows)).toEqual(["ana"]);
    expect(result.me).toMatchObject({ position: 3, account: { handle: "caio" } });
  });

  it("dia só com Modo não conta como jogado, e Modo depois da Rodada não muda o desempate", async () => {
    const duplaWin = { slug: "dupla", dateKey: D1, guesses: dupla.createChallenge(D1).answer as string[] };
    await registerPlay(db, caio, duplaWin, noon(D1));
    await registerPlay(db, ana, palavraIn(1, D1), noon(D1, 1));
    await registerPlay(db, bia, palavraIn(1, D1), noon(D1, 2));
    await registerPlay(db, ana, duplaWin, noon(D1, 3));
    const result = await ranking(db, { kind: "daily", dateKey: D1 }, { now: noon(D1, 30) });
    expect(handles(result.rows)).toEqual(["ana", "bia"]);
  });

  it("dias anteriores continuam consultáveis, mas o futuro não", async () => {
    await registerPlay(db, ana, palavraIn(1, D1), noon(D1));
    const later = noon(D2);
    expect(handles((await ranking(db, { kind: "daily", dateKey: D1 }, { now: later })).rows)).toEqual(["ana"]);
    await expect(ranking(db, { kind: "daily", dateKey: addDays(D2, 1) }, { now: later })).rejects.toMatchObject({ status: 400 });
  });
});

describe("Média de 30 dias", () => {
  it("conta dia sem jogar como zero", async () => {
    await registerPlay(db, ana, palavraIn(1, D1), noon(D1));
    await registerPlay(db, ana, palavraIn(1, D2), noon(D2));
    await registerPlay(db, bia, palavraIn(1, D2), noon(D2));
    const result = await ranking(db, { kind: "rolling" }, { now: noon(D2, 30) });
    expect(result.rows.map((r) => [r.account.handle, r.total, r.value])).toEqual([
      ["ana", 200, 6.7],
      ["bia", 100, 3.3],
    ]);
  });

  it("dias fora da janela saem da conta", async () => {
    await registerPlay(db, ana, palavraIn(1, D1), noon(D1));
    const result = await ranking(db, { kind: "rolling" }, { now: noon(addDays(D1, 30)) });
    expect(result.rows).toEqual([]);
  });

  it("por jogo usa a Nota daquele jogo", async () => {
    await registerPlay(db, ana, palavraIn(2, D1), noon(D1));
    await registerPlay(db, bia, palavraIn(1, D1), noon(D1));
    const result = await ranking(db, { kind: "game", slug: "palavra" }, { now: noon(D1, 30) });
    expect(result.rows.map((r) => [r.account.handle, r.value])).toEqual([
      ["bia", 3.3],
      ["ana", 2.8],
    ]);
    expect((await ranking(db, { kind: "game", slug: "elo" }, { now: noon(D1, 30) })).rows).toEqual([]);
    await expect(ranking(db, { kind: "game", slug: "xadrez" }, {})).rejects.toMatchObject({ status: 400 });
  });
});

describe("Ranking do Grupo", () => {
  it("usa os mesmos números, só com os membros, e mostra quem ainda não jogou", async () => {
    const group = await createGroup(db, ana, { name: "Família" });
    await joinGroup(db, caio, { code: group.inviteCode });
    await registerPlay(db, bia, palavraIn(1, D1), noon(D1)); // fora do Grupo
    await registerPlay(db, ana, palavraIn(2, D1), noon(D1));

    const result = await ranking(db, { kind: "daily", dateKey: D1 }, { groupId: group.id, accountId: ana, now: noon(D1, 30) });
    expect(result.rows.map((r) => [r.account.handle, r.position, r.value, r.played])).toEqual([
      ["ana", 1, 83, true],
      ["caio", 2, 0, false],
    ]);
    expect(result.participants).toBe(2);
  });

  it("só membros veem", async () => {
    const group = await createGroup(db, ana, { name: "Família" });
    await expect(ranking(db, { kind: "rolling" }, { groupId: group.id, accountId: bia })).rejects.toMatchObject({ status: 403 });
    await expect(ranking(db, { kind: "rolling" }, { groupId: group.id })).rejects.toMatchObject({ status: 403 });
  });
});
