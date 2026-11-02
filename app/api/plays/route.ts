import { getDb } from "@/server/db";
import { readJson, requireAccount, respond } from "@/server/http";
import { registerPlay } from "@/server/plays";

/** Registra uma Partida do dia terminada: { slug, dateKey, guesses }. */
export async function POST(request: Request) {
  return respond(async () => registerPlay(getDb(), await requireAccount(request), await readJson(request)));
}
