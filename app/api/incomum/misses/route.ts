import { getDb } from "@/server/db";
import { readJson, respond } from "@/server/http";
import { recordMiss } from "@/server/incomum-misses";

/** Uma resposta que o Incomum recusou: { dateKey, index, input }. Vale para quem não entrou na Conta. */
export async function POST(request: Request) {
  return respond(async () => recordMiss(getDb(), await readJson(request)));
}
