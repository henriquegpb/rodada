import { eq } from "drizzle-orm";
import type { Db } from "./db";
import { user } from "./db/schema";
import { AppError } from "./errors";
import { leaveAllGroups } from "./groups";

/** Moderação: uma Conta com `admin` no banco pode excluir a Conta de outra pessoa (`dev` é só a pílula). */

/**
 * Exclui a Conta `targetId` a pedido de `adminId`, que precisa ter `admin`. Sai tudo, como na exclusão
 * pela própria pessoa: os Grupos passam adiante e o resto (partidas, Scores, Conquistas, sessões,
 * logins) sai em cascata. Devolve a foto, para quem chamou apagar do armazenamento.
 */
export async function deleteAccountAsAdmin(db: Db, adminId: string, targetId: string): Promise<{ image: string | null }> {
  const [requester] = await db.select({ admin: user.admin }).from(user).where(eq(user.id, adminId));
  if (!requester?.admin) throw new AppError(403, "forbidden", "Só quem é Admin pode excluir Contas");
  if (targetId === adminId) throw new AppError(400, "invalid_request", "Para excluir a própria Conta, use o Perfil");

  const [target] = await db.select({ image: user.image }).from(user).where(eq(user.id, targetId));
  if (!target) throw new AppError(404, "not_found", "Conta não encontrada");

  await leaveAllGroups(db, targetId);
  await db.delete(user).where(eq(user.id, targetId));
  return { image: target.image };
}
