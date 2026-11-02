import { getDb } from "@/server/db";
import { readJson, requireAccount, respond } from "@/server/http";
import { getMe, updateProfile } from "@/server/profiles";

/** O próprio Perfil, com e-mail e se já importou as partidas do navegador. */
export async function GET(request: Request) {
  return respond(async () => getMe(getDb(), await requireAccount(request)));
}

/** Edita o próprio Perfil: { handle?, name?, bio? }. */
export async function PATCH(request: Request) {
  return respond(async () => updateProfile(getDb(), await requireAccount(request), await readJson(request)));
}
