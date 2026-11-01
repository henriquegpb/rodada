import { getDb } from "@/server/db";
import { readJson, requireAccount, respond } from "@/server/http";
import { startTimedPlay } from "@/server/plays";

/** Jogos com tempo: começa o relógio no servidor. { slug, dateKey } */
export async function POST(request: Request) {
  return respond(async () => startTimedPlay(getDb(), await requireAccount(request), await readJson(request)));
}
