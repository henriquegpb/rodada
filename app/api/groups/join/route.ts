import { getDb } from "@/server/db";
import { joinGroup } from "@/server/groups";
import { readJson, requireAccount, respond } from "@/server/http";

/** Entra num Grupo pelo código do convite: { code }. */
export async function POST(request: Request) {
  return respond(async () => joinGroup(getDb(), await requireAccount(request), await readJson(request)));
}
