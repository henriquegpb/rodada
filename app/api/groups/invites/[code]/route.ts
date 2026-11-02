import { getDb } from "@/server/db";
import { invitePreview } from "@/server/groups";
import { respond } from "@/server/http";

/** O que o link de convite mostra antes de entrar (público): nome, membros e se está cheio. */
export async function GET(_request: Request, ctx: RouteContext<"/api/groups/invites/[code]">) {
  return respond(async () => invitePreview(getDb(), (await ctx.params).code));
}
