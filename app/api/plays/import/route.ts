import { getDb } from "@/server/db";
import { readJson, requireAccount, respond } from "@/server/http";
import { importPlays } from "@/server/plays";

/** Importa, uma vez, as Partidas do dia guardadas no navegador. { plays: [{ slug, dateKey, guesses, finishedAt? }] } */
export async function POST(request: Request) {
  return respond(async () => importPlays(getDb(), await requireAccount(request), await readJson(request)));
}
