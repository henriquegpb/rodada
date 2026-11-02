import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./db";
import { createAccount, createTestDb } from "./db/testing";
import {
  MAX_GROUPS_PER_ACCOUNT,
  MAX_MEMBERS,
  createGroup,
  getGroup,
  invitePreview,
  joinGroup,
  leaveAllGroups,
  leaveGroup,
  listGroups,
  regenerateInvite,
  removeMember,
  renameGroup,
} from "./groups";

let db: Db;
let ana: string;
let bia: string;

beforeEach(async () => {
  db = await createTestDb();
  ana = await createAccount(db, "ana");
  bia = await createAccount(db, "bia");
});

describe("Grupos", () => {
  it("quem cria vira dono e entra; convidado entra pelo código", async () => {
    const group = await createGroup(db, ana, { name: "  Família  " });
    expect(group).toMatchObject({ name: "Família", memberCount: 1, isOwner: true });
    expect(await invitePreview(db, group.inviteCode)).toMatchObject({ name: "Família", memberCount: 1, full: false });

    expect(await joinGroup(db, bia, { code: group.inviteCode })).toMatchObject({ memberCount: 2, isOwner: false });
    // Entrar de novo não é erro.
    expect(await joinGroup(db, bia, { code: group.inviteCode })).toMatchObject({ memberCount: 2 });
    const detail = await getGroup(db, bia, group.id);
    expect(detail.members.map((m) => m.handle)).toEqual(["ana", "bia"]);
  });

  it("recusa nome vazio ou longo e convite inválido", async () => {
    await expect(createGroup(db, ana, { name: " " })).rejects.toMatchObject({ code: "invalid_name" });
    await expect(createGroup(db, ana, { name: "x".repeat(41) })).rejects.toMatchObject({ code: "invalid_name" });
    await expect(joinGroup(db, bia, { code: "nada" })).rejects.toMatchObject({ code: "invalid_invite" });
  });

  it(`cada Conta participa de no máximo ${MAX_GROUPS_PER_ACCOUNT} Grupos`, async () => {
    for (let i = 0; i < MAX_GROUPS_PER_ACCOUNT; i++) await createGroup(db, ana, { name: `G${i}` });
    await expect(createGroup(db, ana, { name: "mais um" })).rejects.toMatchObject({ code: "too_many_groups" });
    const other = await createGroup(db, bia, { name: "da Bia" });
    await expect(joinGroup(db, ana, { code: other.inviteCode })).rejects.toMatchObject({ code: "too_many_groups" });
    expect(await listGroups(db, ana)).toHaveLength(MAX_GROUPS_PER_ACCOUNT);
  });

  it(`cada Grupo tem no máximo ${MAX_MEMBERS} membros`, async () => {
    const group = await createGroup(db, ana, { name: "Lotado" });
    for (let i = 1; i < MAX_MEMBERS; i++) await joinGroup(db, await createAccount(db, `m${i}`), { code: group.inviteCode });
    expect((await invitePreview(db, group.inviteCode)).full).toBe(true);
    await expect(joinGroup(db, bia, { code: group.inviteCode })).rejects.toMatchObject({ code: "group_full" });
  });

  it("dono que sai passa o Grupo para o membro mais antigo; o último a sair apaga o Grupo", async () => {
    const group = await createGroup(db, ana, { name: "Família" });
    await joinGroup(db, bia, { code: group.inviteCode });
    await leaveGroup(db, ana, group.id);
    expect(await getGroup(db, bia, group.id)).toMatchObject({ ownerId: bia, isOwner: true, memberCount: 1 });
    await leaveGroup(db, bia, group.id);
    await expect(invitePreview(db, group.inviteCode)).rejects.toMatchObject({ status: 404 });
  });

  it("só o dono renomeia, regenera o convite e remove membros", async () => {
    const group = await createGroup(db, ana, { name: "Família" });
    await joinGroup(db, bia, { code: group.inviteCode });
    await expect(renameGroup(db, bia, group.id, { name: "Meu" })).rejects.toMatchObject({ code: "not_owner" });
    await expect(regenerateInvite(db, bia, group.id)).rejects.toMatchObject({ code: "not_owner" });
    await expect(removeMember(db, bia, group.id, ana)).rejects.toMatchObject({ code: "not_owner" });

    expect(await renameGroup(db, ana, group.id, { name: "Família 2" })).toEqual({ name: "Família 2" });
    const { inviteCode } = await regenerateInvite(db, ana, group.id);
    expect(inviteCode).not.toBe(group.inviteCode);
    await expect(invitePreview(db, group.inviteCode)).rejects.toMatchObject({ status: 404 });

    await removeMember(db, ana, group.id, bia);
    await expect(getGroup(db, bia, group.id)).rejects.toMatchObject({ code: "not_a_member" });
  });

  it("antes de excluir a Conta, sai de todos os Grupos passando a posse adiante", async () => {
    const mine = await createGroup(db, ana, { name: "Da Ana" });
    const theirs = await createGroup(db, bia, { name: "Da Bia" });
    await joinGroup(db, bia, { code: mine.inviteCode });
    await joinGroup(db, ana, { code: theirs.inviteCode });
    await leaveAllGroups(db, ana);
    expect(await listGroups(db, ana)).toEqual([]);
    expect((await listGroups(db, bia)).map((g) => [g.name, g.isOwner])).toEqual([
      ["Da Bia", true],
      ["Da Ana", true],
    ]);
  });
});
