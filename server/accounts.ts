import { eq } from "drizzle-orm";
import type { Db } from "./db";
import { user } from "./db/schema";
import { AppError } from "./errors";
import { leaveAllGroups } from "./groups";

/** Moderação: uma Conta com `dev` no banco pode excluir a Conta de outra pessoa. */

/**
 * Exclui a Conta `targetId` a pedido de `devId`, que precisa ter `dev`. Sai tudo, como na exclusão
 * pela própria pessoa: os Grupos passam adiante e o resto (partidas, Scores, Conquistas, sessões,
 * logins) sai em cascata. Devolve a foto, para quem chamou apagar do armazenamento.
 */
export async function deleteAccountAsDev(db: Db, devId: string, targetId: string): Promise<{ image: string | null }> {
  const [requester] = await db.select({ dev: user.dev }).from(user).where(eq(user.id, devId));
  if (!requester?.dev) throw new AppError(403, "forbidden", "Só quem é Dev pode excluir Contas");
  if (targetId === devId) throw new AppError(400, "invalid_request", "Para excluir a própria Conta, use o Perfil");

  const [target] = await db.select({ image: user.image }).from(user).where(eq(user.id, targetId));
  if (!target) throw new AppError(404, "not_found", "Conta não encontrada");

  await leaveAllGroups(db, targetId);
  await db.delete(user).where(eq(user.id, targetId));
  return { image: target.image };
}
