import { getDb } from "@/server/db";
import { respond } from "@/server/http";
import { getProfile } from "@/server/profiles";

/** Perfil público pelo handle. */
export async function GET(_request: Request, ctx: RouteContext<"/api/profiles/[handle]">) {
  return respond(async () => getProfile(getDb(), (await ctx.params).handle));
}
