import { randomBytes } from "node:crypto";
import { and, asc, count, eq, sql } from "drizzle-orm";
import type { Db } from "./db";
import { groupMembers, groups, user } from "./db/schema";
import { AppError } from "./errors";
import { lockAccount } from "./plays";

/** Grupos: até 50 Contas com Ranking próprio; cada Conta participa de até 5. */

export const MAX_GROUPS_PER_ACCOUNT = 5;
export const MAX_MEMBERS = 50;
const MAX_NAME = 40;

/** Sem 0/O e 1/l/I, para o código poder ser lido e digitado. */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

function randomCode(length: number): string {
  return [...randomBytes(length)].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

function parseName(name: unknown): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > MAX_NAME) {
    throw new AppError(400, "invalid_name", `O nome do Grupo precisa ter de 1 a ${MAX_NAME} caracteres`);
  }
  return trimmed;
}

export interface GroupSummary {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  isOwner: boolean;
}

export interface GroupDetail extends GroupSummary {
  ownerId: string;
  members: { id: string; handle: string; name: string; image: string | null; dev: boolean; joinedAt: Date }[];
}

async function membershipCount(db: Db, accountId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(groupMembers).where(eq(groupMembers.accountId, accountId));
  return row.n;
}

/** Chame dentro de uma transação: trava a Conta para que duas entradas juntas não passem de 5 Grupos. */
async function ensureRoomForAccount(db: Db, accountId: string) {
  await lockAccount(db, accountId);
  if ((await membershipCount(db, accountId)) >= MAX_GROUPS_PER_ACCOUNT) {
    throw new AppError(409, "too_many_groups", `Você já está em ${MAX_GROUPS_PER_ACCOUNT} Grupos. Saia de um para entrar em outro.`);
  }
}

async function ownedGroup(db: Db, accountId: string, groupId: string) {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new AppError(404, "not_found", "Grupo não encontrado");
  if (group.ownerId !== accountId) throw new AppError(403, "not_owner", "Só o dono do Grupo pode fazer isso");
  return group;
}

export async function createGroup(db: Db, accountId: string, input: unknown): Promise<GroupSummary> {
  const name = parseName((input as { name?: unknown })?.name);
  return db.transaction(async (tx) => {
    await ensureRoomForAccount(tx, accountId);
    const [group] = await tx
      .insert(groups)
      .values({ id: randomCode(12), name, ownerId: accountId, inviteCode: randomCode(8) })
      .returning();
    await tx.insert(groupMembers).values({ groupId: group.id, accountId });
    return { id: group.id, name, inviteCode: group.inviteCode, memberCount: 1, isOwner: true };
  });
}

export async function listGroups(db: Db, accountId: string): Promise<GroupSummary[]> {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      inviteCode: groups.inviteCode,
      ownerId: groups.ownerId,
      memberCount: sql<number>`(select count(*)::int from ${groupMembers} gm where gm.group_id = ${groups.id})`,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.accountId, accountId))
    .orderBy(asc(groupMembers.joinedAt));
  return rows.map(({ ownerId, ...g }) => ({ ...g, isOwner: ownerId === accountId }));
}

/** O Grupo com os membros. Só quem é membro vê. */
export async function getGroup(db: Db, accountId: string, groupId: string): Promise<GroupDetail> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new AppError(404, "not_found", "Grupo não encontrado");
  const members = await db
    .select({
      id: user.id,
      handle: user.handle,
      name: user.name,
      image: user.image,
      dev: user.dev,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(user, eq(user.id, groupMembers.accountId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(asc(groupMembers.joinedAt));
  if (!members.some((m) => m.id === accountId)) throw new AppError(403, "not_a_member", "Você não está neste Grupo");
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    ownerId: group.ownerId,
    isOwner: group.ownerId === accountId,
    memberCount: members.length,
    members,
  };
}

/** O que o link de convite mostra antes de entrar (público). */
export async function invitePreview(db: Db, code: string) {
  const [group] = await db
    .select({
      id: groups.id,
      name: groups.name,
      memberCount: sql<number>`(select count(*)::int from ${groupMembers} gm where gm.group_id = ${groups.id})`,
    })
    .from(groups)
    .where(eq(groups.inviteCode, code));
  if (!group) throw new AppError(404, "invalid_invite", "Convite inválido ou expirado");
  return { ...group, full: group.memberCount >= MAX_MEMBERS };
}

/** Entra pelo código de convite. Já ser membro não é erro: devolve o Grupo. */
export async function joinGroup(db: Db, accountId: string, input: unknown): Promise<GroupSummary> {
  const code = (input as { code?: unknown })?.code;
  if (typeof code !== "string") throw new AppError(400, "invalid_request", "Envie o código do convite");
  return db.transaction(async (tx) => {
    // Trava o Grupo para que duas entradas ao mesmo tempo não passem do limite.
    const [group] = await tx.select().from(groups).where(eq(groups.inviteCode, code)).for("update");
    if (!group) throw new AppError(404, "invalid_invite", "Convite inválido ou expirado");
    const members = await tx.select({ accountId: groupMembers.accountId }).from(groupMembers).where(eq(groupMembers.groupId, group.id));
    const summary = (memberCount: number) => ({
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
      memberCount,
      isOwner: group.ownerId === accountId,
    });
    if (members.some((m) => m.accountId === accountId)) return summary(members.length);
    if (members.length >= MAX_MEMBERS) throw new AppError(409, "group_full", `Este Grupo já tem ${MAX_MEMBERS} pessoas`);
    await ensureRoomForAccount(tx, accountId);
    await tx.insert(groupMembers).values({ groupId: group.id, accountId });
    return summary(members.length + 1);
  });
}

/** Tira a Conta do Grupo. Se era o dono, o Grupo passa para o membro mais antigo; vazio, deixa de existir. */
async function removeFromGroup(db: Db, groupId: string, accountId: string) {
  const removed = await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.accountId, accountId)))
    .returning();
  if (removed.length === 0) throw new AppError(404, "not_a_member", "Você não está neste Grupo");
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).for("update");
  if (!group || group.ownerId !== accountId) return;
  const [heir] = await db
    .select({ accountId: groupMembers.accountId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(asc(groupMembers.joinedAt))
    .limit(1);
  if (heir) await db.update(groups).set({ ownerId: heir.accountId }).where(eq(groups.id, groupId));
  else await db.delete(groups).where(eq(groups.id, groupId));
}

export async function leaveGroup(db: Db, accountId: string, groupId: string) {
  await db.transaction((tx) => removeFromGroup(tx, groupId, accountId));
}

/** Antes de excluir a Conta: sai de todos os Grupos, passando adiante os que eram dela. */
export async function leaveAllGroups(db: Db, accountId: string) {
  for (const group of await listGroups(db, accountId)) await leaveGroup(db, accountId, group.id);
}

export async function removeMember(db: Db, ownerId: string, groupId: string, memberId: string) {
  await db.transaction(async (tx) => {
    await ownedGroup(tx, ownerId, groupId);
    if (memberId === ownerId) throw new AppError(400, "invalid_request", "Para sair do próprio Grupo, use sair");
    await removeFromGroup(tx, groupId, memberId);
  });
}

export async function renameGroup(db: Db, ownerId: string, groupId: string, input: unknown) {
  const name = parseName((input as { name?: unknown })?.name);
  await ownedGroup(db, ownerId, groupId);
  await db.update(groups).set({ name }).where(eq(groups.id, groupId));
  return { name };
}

/** Novo código de convite; o antigo para de funcionar. */
export async function regenerateInvite(db: Db, ownerId: string, groupId: string) {
  await ownedGroup(db, ownerId, groupId);
  const inviteCode = randomCode(8);
  await db.update(groups).set({ inviteCode }).where(eq(groups.id, groupId));
  return { inviteCode };
}
