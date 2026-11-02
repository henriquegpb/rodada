"use client";

import { challengeNumber } from "@/lib/daily/date";
import { useToday } from "@/lib/daily/hooks";
import { useMe } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { Boards } from "./boards";
import { AccountLine, SignInButtons } from "./sign-in";

/** O Ranking do dia de todo mundo. Quem não entrou vê a lista e o convite para aparecer nela. */
export function RankingScreen() {
  const today = useToday();
  const me = useMe();
  if (!today) return null;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-6xl leading-[0.9]">{t.ranking.title}</h1>
            <p className="mt-3 text-muted-foreground">{t.ranking.subtitle(challengeNumber(today))}</p>
          </div>
          {me === null && <SignInButtons from="ranking" />}
        </div>
        {me && (
          <div className="mt-3">
            <AccountLine me={me} />
          </div>
        )}
      </header>
      <Boards dateKey={today} />
    </div>
  );
}
