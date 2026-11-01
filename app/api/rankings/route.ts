import { getDateKey } from "@/lib/daily/date";
import { cachedGlobalRanking } from "@/server/cached";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { optionalAccount, requireAccount, respond } from "@/server/http";
import { ranking, type RankingKind } from "@/server/rankings";

/**
 * Rankings. Parâmetros:
 *  - kind: "daily" (com date=AAAA-MM-DD, padrão hoje), "rolling" (Média de 30 dias) ou "game" (com slug)
 *  - group: id do Grupo; sem ele, o Ranking geral
 *  - limit: quantas posições (padrão 100, máximo 100)
 */
export async function GET(request: Request) {
  return respond(async () => {
    const params = new URL(request.url).searchParams;
    const today = getDateKey();
    const kindName = params.get("kind") ?? "daily";
    let kind: RankingKind;
    if (kindName === "daily") kind = { kind: "daily", dateKey: params.get("date") ?? today };
    else if (kindName === "rolling") kind = { kind: "rolling" };
    else if (kindName === "game") kind = { kind: "game", slug: params.get("slug") ?? "" };
    else throw new AppError(400, "invalid_request", "kind deve ser daily, rolling ou game");
    const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 100));

    const groupId = params.get("group");
    if (groupId) return ranking(getDb(), kind, { groupId, accountId: await requireAccount(request), limit, today });

    const accountId = await optionalAccount(request);
    const [top, mine] = await Promise.all([
      cachedGlobalRanking(kind, today, limit),
      accountId ? ranking(getDb(), kind, { accountId, limit: 0, today }) : null,
    ]);
    return { ...top, me: mine?.me ?? null };
  });
}
