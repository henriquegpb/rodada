import { getDb } from "@/server/db";
import { removeMember } from "@/server/groups";
import { requireAccount, respond } from "@/server/http";

/** Remove um membro (só o dono). */
export async function DELETE(request: Request, ctx: RouteContext<"/api/groups/[id]/members/[accountId]">) {
  return respond(async () => {
    const { id, accountId } = await ctx.params;
    return removeMember(getDb(), await requireAccount(request), id, accountId);
  });
}
