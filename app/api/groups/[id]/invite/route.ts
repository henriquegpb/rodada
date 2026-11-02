import { getDb } from "@/server/db";
import { regenerateInvite } from "@/server/groups";
import { requireAccount, respond } from "@/server/http";

/** Gera um novo código de convite (só o dono); o antigo para de funcionar. */
export async function POST(request: Request, ctx: RouteContext<"/api/groups/[id]/invite">) {
  return respond(async () => regenerateInvite(getDb(), await requireAccount(request), (await ctx.params).id));
}
