import { getDb } from "@/server/db";
import { optionalAccount, respond } from "@/server/http";
import { handleAvailability } from "@/server/profiles";

/** O handle é válido e está livre? Para avisar enquanto a pessoa digita. */
export async function GET(request: Request, ctx: RouteContext<"/api/handles/[handle]">) {
  return respond(async () => handleAvailability(getDb(), (await ctx.params).handle, await optionalAccount(request)));
}
