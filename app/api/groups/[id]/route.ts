import { getDb } from "@/server/db";
import { getGroup, renameGroup } from "@/server/groups";
import { readJson, requireAccount, respond } from "@/server/http";

/** O Grupo com os membros (só membros). */
export async function GET(request: Request, ctx: RouteContext<"/api/groups/[id]">) {
  return respond(async () => getGroup(getDb(), await requireAccount(request), (await ctx.params).id));
}

/** Renomeia (só o dono): { name }. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/groups/[id]">) {
  return respond(async () =>
    renameGroup(getDb(), await requireAccount(request), (await ctx.params).id, await readJson(request)),
  );
}
