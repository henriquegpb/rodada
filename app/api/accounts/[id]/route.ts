import { revalidateTag } from "next/cache";
import { deleteAccountAsDev } from "@/server/accounts";
import { deleteAvatar } from "@/server/avatars";
import { RANKINGS_TAG } from "@/server/cached";
import { getDb } from "@/server/db";
import { requireAccount, respond } from "@/server/http";

/**
 * Exclui a Conta de outra pessoa, com tudo dela (só para quem tem `dev`). O Ranking geral em cache
 * expira na hora, para a Conta sumir da lista no próximo pedido.
 */
export async function DELETE(request: Request, ctx: RouteContext<"/api/accounts/[id]">) {
  return respond(async () => {
    const { image } = await deleteAccountAsDev(getDb(), await requireAccount(request), (await ctx.params).id);
    await deleteAvatar(image);
    revalidateTag(RANKINGS_TAG, { expire: 0 });
  });
}
