import { getDb } from "@/server/db";
import { createGroup, listGroups } from "@/server/groups";
import { readJson, requireAccount, respond } from "@/server/http";

/** Os meus Grupos. */
export async function GET(request: Request) {
  return respond(async () => listGroups(getDb(), await requireAccount(request)));
}

/** Cria um Grupo: { name }. Quem cria vira dono. */
export async function POST(request: Request) {
  return respond(async () => createGroup(getDb(), await requireAccount(request), await readJson(request)));
}
