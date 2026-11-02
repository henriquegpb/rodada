import { getDb } from "@/server/db";
import { leaveGroup } from "@/server/groups";
import { requireAccount, respond } from "@/server/http";

/** Sai do Grupo. O dono que sai passa o Grupo para o membro mais antigo. */
export async function POST(request: Request, ctx: RouteContext<"/api/groups/[id]/leave">) {
  return respond(async () => leaveGroup(getDb(), await requireAccount(request), (await ctx.params).id));
}
