import { cacheLife } from "next/cache";
import { addDays } from "@/lib/daily/date";
import { getDb } from "./db";
import { ranking, type RankingKind } from "./rankings";

/**
 * Rankings gerais em cache: todo mundo vê a mesma lista, então ela é calculada uma vez por janela
 * em vez de uma vez por pedido. A linha de quem pediu é calculada à parte, sem cache. Os Rankings
 * de Grupo (até 50 Contas) não passam por aqui. `today` faz parte da chave: o cache vira com o dia.
 */
export async function cachedGlobalRanking(kind: RankingKind, today: string, limit: number) {
  "use cache";
  // Dias passados mudam pouco (ontem até 5 minutos depois da meia-noite; importações a qualquer hora).
  if (kind.kind === "daily" && kind.dateKey < addDays(today, -1)) cacheLife("hours");
  else if (kind.kind === "daily") cacheLife("minutes");
  else cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return ranking(getDb(), kind, { limit, today });
}
