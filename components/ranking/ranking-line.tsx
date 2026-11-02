"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { useBoard, useMe } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";

/**
 * No resultado da partida do dia: a posição no ranking do jogo, ou o convite para entrar na Conta
 * e aparecer nele (a partida vai junto).
 */
export function RankingLine({ slug, dateKey }: { slug: string; dateKey: string }) {
  const me = useMe();
  const { board } = useBoard({ dateKey: me ? dateKey : null, slug });
  if (me === undefined) return null;

  const label = !me
    ? t.ranking.join
    : board?.me
      ? t.ranking.position(board.me.position, board.participants)
      : t.ranking.see;
  return (
    <Link
      href="/ranking"
      className="flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm transition-colors hover:bg-secondary"
    >
      <Trophy size={15} className="shrink-0 text-primary" />
      <span className="min-w-0 truncate">{label}</span>
      <ArrowRight size={15} className="ml-auto shrink-0 text-muted-foreground" />
    </Link>
  );
}
