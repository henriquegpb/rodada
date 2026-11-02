"use client";

/** Peças das telas de ranking e de grupos: o ranking do dia com as abas e as listas paginadas. */

import { useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { games, getGame } from "@/games";
import type { GameMeta } from "@/games/types";
import { formatResult } from "@/lib/plays/result";
import { useBoard } from "@/lib/ranking/client";
import type { Ranking, RankingRow } from "@/server/rankings";
import { RINGS } from "@/components/profile/achievement-badge";
import { ProfileLink } from "@/components/profile/profile-link";
import { Champion } from "./champion";
import { GlideSwap } from "@/components/ui/glide-swap";
import { PillTabs } from "@/components/ui/pill-tabs";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Linhas por página em todo ranking. */
const PAGE_SIZE = 20;

/** O valor da aba do ranking geral; não colide com slug de jogo. */
const OVERALL = "geral";

/** As abas, na ordem: o geral e cada jogo (modos inclusive). */
const VIEWS = [OVERALL, ...games.map((g) => g.meta.slug)];

/**
 * O ranking do dia, o de todo mundo ou o de um Grupo: o geral e o de cada jogo (modos inclusive)
 * na mesma lista, trocados pela pílula. Cada aba busca o seu; a pílula muda na hora e a lista
 * troca deslizando quando a nova chega (sem piscar "carregando" no meio). Trocar de aba volta para
 * a primeira página.
 */
export function Boards({ dateKey, group }: { dateKey: string; group?: string }) {
  const [view, setView] = useState(OVERALL);
  const { board, error } = useBoard({ dateKey, slug: view === OVERALL ? undefined : view, group });

  // O que está na tela: a última aba que chegou (ou falhou). Estado derivado, no próprio render.
  const [shown, setShown] = useState<{ view: string; board: Ranking | null; error: string | null } | null>(null);
  if ((board || error) && (shown?.view !== view || shown.board !== board || shown.error !== error)) {
    setShown({ view, board, error });
  }
  const [direction, setDirection] = useState<1 | -1>(1);
  const champion = shown?.board?.me?.played && shown.board.me.position === 1;

  return (
    <section>
      {champion && <Champion key={shown.view} />}
      <PillTabs
        label={t.ranking.title}
        value={view}
        onChange={(next) => {
          setDirection(VIEWS.indexOf(next) >= VIEWS.indexOf(view) ? 1 : -1);
          setView(next);
        }}
        options={[
          { key: OVERALL, label: t.ranking.overall },
          ...games.map(({ meta: game }) => ({ key: game.slug, label: game.name, color: game.color })),
        ]}
      />
      {shown ? (
        <GlideSwap id={shown.view} direction={direction} className="mt-6">
          <Panel view={shown.view} board={shown.board} error={shown.error} />
        </GlideSwap>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">{t.ranking.loading}</p>
      )}
    </section>
  );
}

function Panel({ view, board, error }: { view: string; board: Ranking | null; error: string | null }) {
  const meta = view === OVERALL ? null : getGame(view)!.meta;
  return (
    <div role="tabpanel">
      <div className="mb-4 flex items-baseline justify-between gap-6">
        <p className="text-sm text-muted-foreground">{meta ? meta.tagline : t.ranking.overallHint}</p>
        {board && board.participants > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{t.ranking.players(board.participants)}</span>
        )}
      </div>
      {!board ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : meta ? (
        <GameBoard meta={meta} board={board} />
      ) : (
        <Rows
          board={board}
          empty={t.ranking.emptyOverall}
          value={(row) =>
            row.played ? (
              <>
                {row.count !== null && <span className="text-xs text-muted-foreground">{t.ranking.games(row.count)}</span>}
                <span className="w-16 text-right font-semibold">{t.ranking.points(row.value)}</span>
              </>
            ) : (
              <NotPlayed />
            )
          }
        />
      )}
    </div>
  );
}

export function SectionTitle({ players, children }: { players: number; children: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-xl">{children}</h2>
      {players > 0 && <span className="text-xs text-muted-foreground tabular-nums">{t.ranking.players(players)}</span>}
    </div>
  );
}

function GameBoard({ meta, board }: { meta: GameMeta; board: Ranking }) {
  return (
    <Rows
      board={board}
      empty={t.ranking.empty}
      value={(row) =>
        row.played && row.status && row.count !== null ? (
          <>
            <span className="text-xs text-muted-foreground">{t.ranking.points(row.value)}</span>
            <span
              className={cn(
                "flex w-24 items-center justify-end gap-1 font-semibold",
                row.status === "lost" && "text-muted-foreground",
              )}
              style={row.status === "lost" ? undefined : { color: meta.color }}
            >
              {row.status === "won" && <Check size={14} strokeWidth={3} />}
              {row.status === "lost" && <X size={14} strokeWidth={3} />}
              {formatResult(meta.rules, row.status, row.count)}
            </span>
          </>
        ) : (
          <NotPlayed />
        )
      }
    />
  );
}

/** No Grupo aparecem todos os membros; quem ainda não jogou fica no fim, sem placar. */
function NotPlayed() {
  return <span className="text-xs text-muted-foreground">{t.ranking.notPlayed}</span>;
}

/**
 * As linhas de um ranking, `PAGE_SIZE` por página. A da pessoa ganha destaque; numa página em que
 * ela não está (ou se está além das linhas que vieram), a linha dela fica presa embaixo, depois de
 * "…", e o paginador ganha "Minha posição".
 */
function Rows({
  board,
  empty,
  value,
}: {
  board: Ranking;
  empty: string;
  value: (row: RankingRow) => ReactNode;
}) {
  const [page, setPage] = useState(0);
  if (!board.rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;

  const pages = Math.ceil(board.rows.length / PAGE_SIZE);
  // O ranking se atualiza sozinho: se encolher, a página não fica apontando para o vazio.
  const current = Math.min(page, pages - 1);
  const meId = board.me?.account.id;
  const myIndex = meId ? board.rows.findIndex((row) => row.account.id === meId) : -1;
  const myPage = myIndex < 0 ? null : Math.floor(myIndex / PAGE_SIZE);
  const away = board.me !== null && myPage !== current;
  const row = (r: RankingRow) => (
    <Row key={r.account.id} row={r} me={r.account.id === meId} value={value(r)} />
  );

  return (
    <div>
      <ol className="flex flex-col gap-1">{board.rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map(row)}</ol>
      {away && board.me && (
        <>
          <p aria-hidden="true" className="px-3 py-1 text-muted-foreground">
            …
          </p>
          <ol className="flex flex-col">{row(board.me)}</ol>
        </>
      )}
      {pages > 1 && (
        <Pager page={current} pages={pages} onChange={setPage} myPage={away ? myPage : null} />
      )}
    </div>
  );
}

/** Ouro, prata e bronze. */
const MEDALS = [RINGS.ouro, RINGS.prata, RINGS.bronze];

function Row({ row, me, value }: { row: RankingRow; me: boolean; value: ReactNode }) {
  const podium = row.played && row.position <= 3;
  return (
    <li className="group flex items-center gap-2 text-sm tabular-nums">
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full font-display text-sm",
          podium ? "text-black/80" : "bg-card text-muted-foreground",
        )}
        style={podium ? { background: MEDALS[row.position - 1] } : undefined}
      >
        {row.played ? row.position : "–"}
      </span>
      <div
        className={cn(
          "grid h-11 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3",
          me ? "bg-secondary" : "group-odd:bg-card/60",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ProfileLink handle={row.account.handle} className="truncate font-medium hover:underline">
            {row.account.name}
          </ProfileLink>
          {me && <YouTag />}
        </span>
        <span className="flex items-center gap-4">{value}</span>
      </div>
    </li>
  );
}

export function YouTag() {
  return (
    <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      {t.ranking.you}
    </span>
  );
}

/** ‹ 1 … 4 5 6 … 12 › e, se a pessoa está noutra página, o atalho para ela. */
function Pager({
  page,
  pages,
  onChange,
  myPage,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  myPage: number | null;
}) {
  const button = "grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-medium tabular-nums transition-colors";
  return (
    <nav aria-label={t.ranking.pages} className="mt-5 flex flex-wrap items-center gap-1">
      <button
        type="button"
        aria-label={t.ranking.previous}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className={cn(button, "text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent")}
      >
        <ChevronLeft size={16} />
      </button>
      {pageList(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={t.ranking.page(p + 1)}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn(
              button,
              p === page ? "bg-foreground text-background" : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            {p + 1}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label={t.ranking.next}
        disabled={page === pages - 1}
        onClick={() => onChange(page + 1)}
        className={cn(button, "text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent")}
      >
        <ChevronRight size={16} />
      </button>
      {myPage !== null && (
        <button
          type="button"
          onClick={() => onChange(myPage)}
          className="ml-auto h-9 rounded-full px-3 text-sm font-semibold text-primary transition-[filter] hover:brightness-110"
        >
          {t.ranking.myPosition}
        </button>
      )}
    </nav>
  );
}

/** Páginas mostradas (base 0): todas até 7; acima disso, as pontas e as vizinhas da atual, com null nos buracos. */
function pageList(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
  const keep = [...new Set([0, page - 1, page, page + 1, pages - 1])]
    .filter((p) => p >= 0 && p < pages)
    .sort((a, b) => a - b);
  return keep.flatMap((p, i) => (i > 0 && p - keep[i - 1] > 1 ? [null, p] : [p]));
}
