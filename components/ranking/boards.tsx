"use client";

/** Peças das telas de ranking e de grupos: os rankings com o dia, as abas e as listas paginadas. */

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { games, getGame } from "@/games";
import type { GameMeta } from "@/games/types";
import { formatResult } from "@/lib/plays/result";
import { EPOCH_DATE } from "@/lib/daily/date";
import { usePlayRecords } from "@/lib/plays/hooks";
import { useBoard, useMe, type Period } from "@/lib/ranking/client";
import type { Ranking, RankingRow } from "@/server/rankings";
import { RINGS } from "@/components/profile/achievement-badge";
import { DevBadge } from "@/components/profile/dev-badge";
import { ProfileLink } from "@/components/profile/profile-link";
import { Champion } from "./champion";
import { DeleteAccountButton } from "./delete-account";
import { DayPicker } from "./day-picker";
import { GlideSwap } from "@/components/ui/glide-swap";
import { Skeleton } from "@/components/ui/skeleton";
import { PillTabs } from "@/components/ui/pill-tabs";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Linhas por página em todo ranking. */
const PAGE_SIZE = 20;

/** O valor da aba do ranking geral; não colide com slug de jogo. */
const OVERALL = "geral";

/** As abas, na ordem: o geral e cada jogo (modos inclusive). */
const VIEWS = [OVERALL, ...games.map((g) => g.meta.slug)];

/** O que está na tela: qual ranking e a resposta que chegou para ele. */
interface Shown {
  id: string;
  view: string;
  period: Period;
  date: string;
  board: Ranking | null;
  error: string | null;
}

/**
 * Os rankings, o de todo mundo ou o de um Grupo: o geral e o de cada jogo (modos inclusive) na
 * mesma lista, trocados pela pílula; de um dia (hoje, ou outro escolhido no calendário) ou a Média
 * dos últimos 30 dias. Cada escolha busca o seu; os controles mudam na hora e a lista troca
 * deslizando quando a nova chega (sem piscar "carregando" no meio). Trocar volta para a primeira
 * página.
 */
export function Boards({ dateKey, group }: { dateKey: string; group?: string }) {
  const [view, setView] = useState(OVERALL);
  const [period, setPeriod] = useState<Period>("day");
  // O dia escolhido no calendário; sem escolha, hoje (e passa para o dia novo à meia-noite).
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? dateKey;
  const records = usePlayRecords();
  const played = useMemo(
    () => new Set(records.filter((r) => r.status !== "playing").map((r) => r.dateKey)),
    [records],
  );
  const { board, error } = useBoard({ dateKey: date, slug: view === OVERALL ? undefined : view, group, period });

  // O que está na tela: a última escolha que chegou (ou falhou). Estado derivado, no próprio render.
  const id = `${period}:${period === "day" ? date : ""}:${view}`;
  const [shown, setShown] = useState<Shown | null>(null);
  if ((board || error) && (shown?.id !== id || shown.board !== board || shown.error !== error)) {
    setShown({ id, view, period, date, board, error });
  }
  const [direction, setDirection] = useState<1 | -1>(1);
  const champion = shown?.board?.me?.played && shown.board.me.position === 1;

  return (
    <section>
      {champion && <Champion key={shown.id} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {period === "day" ? (
          <DayPicker
            value={date}
            today={dateKey}
            min={EPOCH_DATE}
            marked={played}
            onChange={(next) => {
              setDirection(next < date ? -1 : 1);
              setPicked(next === dateKey ? null : next);
            }}
          />
        ) : (
          // Na altura do seletor de dia, para os controles não pularem na troca.
          <p className="flex h-8 items-center text-[17px] font-medium leading-6 tracking-[-0.2px]">
            {t.ranking.rollingLabel}
          </p>
        )}
        <PillTabs
          label={t.ranking.period}
          value={period}
          onChange={(next) => {
            setDirection(next === "rolling" ? 1 : -1);
            setPeriod(next as Period);
          }}
          options={[
            { key: "day", label: t.ranking.day },
            { key: "rolling", label: t.ranking.rolling },
          ]}
        />
      </div>
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
        <GlideSwap id={shown.id} direction={direction} className="mt-6">
          <Panel shown={shown} today={dateKey} />
        </GlideSwap>
      ) : (
        <div className="mt-6">
          <RankingSkeleton />
        </div>
      )}
    </section>
  );
}

/** O ranking enquanto a primeira aba não chega: a linha da dica e as linhas com o círculo da posição. */
export function RankingSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label={t.ranking.loading}>
      <div className="mb-4 flex items-center justify-between gap-6">
        <Skeleton className="h-4 w-2/3 max-w-md" />
        <Skeleton className="h-3 w-16" />
      </div>
      <ol className="flex flex-col">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-2">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <div className="flex h-11 flex-1 items-center gap-3 rounded-lg px-3">
              {/* Larguras diferentes, para não parecer uma régua. */}
              <Skeleton className="h-3.5" style={{ width: `${[38, 52, 30, 46, 34, 58, 42, 28][i % 8]}%` }} />
              <Skeleton className="ml-auto h-3.5 w-14" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Panel({ shown, today }: { shown: Shown; today: string }) {
  const { view, period, date, board, error } = shown;
  const meta = view === OVERALL ? null : getGame(view)!.meta;
  const rolling = period === "rolling";
  const hint = rolling
    ? meta
      ? t.ranking.gameRollingHint(meta.name)
      : t.ranking.rollingHint
    : meta
      ? meta.tagline
      : t.ranking.overallHint;
  const empty = rolling
    ? t.ranking.emptyRolling
    : date !== today
      ? t.ranking.emptyDay
      : meta
        ? t.ranking.empty
        : t.ranking.emptyOverall;
  return (
    <div role="tabpanel">
      <div className="mb-4 flex items-baseline justify-between gap-6">
        <p className="text-sm text-muted-foreground">{hint}</p>
        {board && board.participants > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{t.ranking.players(board.participants)}</span>
        )}
      </div>
      {!board ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : rolling ? (
        <Rows
          board={board}
          empty={empty}
          value={(row) =>
            row.played ? (
              <span className="w-20 text-right font-semibold" style={meta ? { color: meta.color } : undefined}>
                {t.ranking.average(row.value)}
              </span>
            ) : (
              <NotPlayed />
            )
          }
        />
      ) : meta ? (
        <GameBoard meta={meta} board={board} empty={empty} />
      ) : (
        <Rows
          board={board}
          empty={empty}
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

function GameBoard({ meta, board, empty }: { meta: GameMeta; board: Ranking; empty: string }) {
  return (
    <Rows
      board={board}
      empty={empty}
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
  // Dev vê um X ao lado de cada nome (menos o próprio) para excluir a Conta.
  const dev = useMe()?.dev === true;
  if (!board.rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;

  const pages = Math.ceil(board.rows.length / PAGE_SIZE);
  // O ranking se atualiza sozinho: se encolher, a página não fica apontando para o vazio.
  const current = Math.min(page, pages - 1);
  const meId = board.me?.account.id;
  const myIndex = meId ? board.rows.findIndex((row) => row.account.id === meId) : -1;
  const myPage = myIndex < 0 ? null : Math.floor(myIndex / PAGE_SIZE);
  const away = board.me !== null && myPage !== current;
  const row = (r: RankingRow) => (
    <Row key={r.account.id} row={r} me={r.account.id === meId} deletable={dev && r.account.id !== meId} value={value(r)} />
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

function Row({ row, me, deletable, value }: { row: RankingRow; me: boolean; deletable: boolean; value: ReactNode }) {
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
          {/* Um pixel acima: alinhada pela altura das letras do nome, não pela caixa da linha. */}
          <DevBadge dev={row.account.dev} className="-translate-y-px" />
          {me && <YouTag />}
          {deletable && <DeleteAccountButton account={row.account} />}
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
