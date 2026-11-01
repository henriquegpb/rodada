import { beforeEach, describe, expect, it } from "vitest";
import { engine as palavra } from "@/games/palavra/engine";
import type { Db } from "./db";
import { createAccount, createTestDb } from "./db/testing";
import { registerPlay } from "./plays";
import { getProfile, handleAvailability, uniqueHandle, updateProfile } from "./profiles";

const D1 = "2026-10-22";
const D2 = "2026-10-23";
const noon = (dateKey: string) => new Date(`${dateKey}T15:00:00Z`);
const win = (dateKey: string) => ({ slug: "palavra", dateKey, guesses: [palavra.createChallenge(dateKey).answer] });

let db: Db;
let ana: string;

beforeEach(async () => {
  db = await createTestDb();
  ana = await createAccount(db, "ana");
});

describe("Perfil", () => {
  it("mostra Sequência, dias jogados, Média de 30 dias, Conquistas e partidas", async () => {
    await registerPlay(db, ana, win(D1), noon(D1));
    await registerPlay(db, ana, win(D2), noon(D2));
    const profile = await getProfile(db, "ANA", noon(D2));
    expect(profile.account).toMatchObject({ handle: "ana", bio: "" });
    expect(profile.streak).toEqual({ current: 2, max: 2, doneToday: true });
    expect(profile.daysPlayed).toBe(2);
    expect(profile.rolling).toEqual({ value: 6.7, position: 1, participants: 1 });
    expect(profile.achievements.find((a) => a.id === "perfeito-palavra")).toMatchObject({ level: "bronze", value: 2 });
    expect(profile.records).toHaveLength(2);
  });

  it("sem partidas na janela não tem Média de 30 dias", async () => {
    const profile = await getProfile(db, "ana", noon(D1));
    expect(profile.rolling).toBe(null);
    expect(profile.streak.current).toBe(0);
  });

  it("perfil inexistente é 404", async () => {
    await expect(getProfile(db, "ninguem")).rejects.toMatchObject({ status: 404 });
  });
});

describe("edição do Perfil", () => {
  it("troca handle, nome e bio", async () => {
    const updated = await updateProfile(db, ana, { handle: "@Ana_Silva", name: " Ana Silva ", bio: "Gosto do Elo" });
    expect(updated).toMatchObject({ handle: "ana_silva", name: "Ana Silva", bio: "Gosto do Elo" });
  });

  it("recusa handle inválido ou já usado", async () => {
    await createAccount(db, "bia");
    await expect(updateProfile(db, ana, { handle: "ab" })).rejects.toMatchObject({ code: "invalid_handle" });
    await expect(updateProfile(db, ana, { handle: "com espaço" })).rejects.toMatchObject({ code: "invalid_handle" });
    await expect(updateProfile(db, ana, { handle: "bia" })).rejects.toMatchObject({ code: "handle_taken" });
    // O próprio handle não conta como em uso.
    await expect(updateProfile(db, ana, { handle: "ana" })).resolves.toMatchObject({ handle: "ana" });
  });

  it("recusa bio longa e nome vazio", async () => {
    await expect(updateProfile(db, ana, { bio: "x".repeat(161) })).rejects.toMatchObject({ code: "invalid_bio" });
    await expect(updateProfile(db, ana, { name: "" })).rejects.toMatchObject({ code: "invalid_name" });
  });
});

describe("uniqueHandle", () => {
  it("nasce do nome, sem acento, e desvia de quem já usa", async () => {
    expect(await uniqueHandle(db, "João Pé", "x@y.com")).toBe("joao_pe");
    expect(await uniqueHandle(db, "Ana", "z@y.com")).toMatch(/^ana_\d+$/);
    expect(await uniqueHandle(db, "Jo", "maria.luz@y.com")).toBe("marialuz");
  });
});

describe("handleAvailability", () => {
  it("diz se o handle é válido e se está livre; o próprio conta como livre", async () => {
    expect(await handleAvailability(db, "@Bia")).toEqual({ handle: "bia", valid: true, available: true });
    expect(await handleAvailability(db, "ana")).toMatchObject({ available: false });
    expect(await handleAvailability(db, "ana", ana)).toMatchObject({ available: true });
    expect(await handleAvailability(db, "a b")).toMatchObject({ valid: false, available: false });
  });
});
