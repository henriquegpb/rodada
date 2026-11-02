import { games, roundGames } from "@/games";
import type { GameRules, PlayStatus } from "@/games/types";
import { createRng, type Rng } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import { gradePlay } from "@/lib/scoring";
import type { GroupDetail, GroupSummary } from "@/server/groups";
import type { Ranking, RankingRow } from "@/server/rankings";

/**
 * Conta, rankings e grupos de mentira para desenhar as telas sem banco (`?mock`, só fora de
 * produção), no formato que a API devolve: empates, várias páginas, "você" fora da primeira
 * página, gente do Grupo que ainda não jogou, jogo sem ninguém.
 */

const NAMES = [
  "Ana", "Bia", "Caio", "Duda", "Enzo", "Fê", "Gabi", "Heitor", "Isa", "João Pedro", "Kaká", "Lulu",
  "Malu", "Nina", "Otávio", "Pietra", "Quim", "Rafa", "Sofia", "Tati", "Ursula", "Vini", "Wesley",
  "Xande", "Yasmin", "Zeca", "mariana.s", "o_palavreiro", "Rainha do Elo", "Tio Beto", "Dona Cida",
  "bandeirante", "Lelê", "Juju", "Guga", "Pepeu", "Cacá", "Nanda", "Tuca", "Dani", "Bruno M.",
  "Carol", "Dedé", "Lipe", "Mila", "Nico", "Paulinha", "Rô", "Serginho", "Teté", "Vavá", "Zé",
  "Mundão", "colmeieira", "Fábio", "Gil", "Helô", "Iago", "Jana", "Léo Capital", "Maria Eduarda",
  "Nathália", "Pedrão",
];

const accounts = NAMES.map((name, i) => ({
  id: `p${i}`,
  handle: normalize(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `jogador_${i}`,
  name,
  image: null,
}));

/** O "você" do mock: joga poucos jogos (fica lá embaixo no geral) e manda bem no Palavra. */
export const MOCK_ME = accounts[0];
const MY_GAMES = new Set(["palavra", "elo", "rainhas", "dupla"]);

/** Grupos do mock: um pequeno, um médio e um que passa de uma página. Todos com o "você". */
const GROUPS = [
  { id: "familia", name: "Família", members: [0, 30, 29, 33, 40, 50] },
  { id: "firma", name: "Firma", members: [0, ...Array.from({ length: 11 }, (_, i) => i * 3 + 2)] },
  { id: "faculdade", name: "Turma da faculdade", members: [0, ...Array.from({ length: 33 }, (_, i) => i + 20)] },
];

const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

/** Uma partida plausível para as regras do jogo. */
function fakePlay(rules: GameRules, rng: Rng): { status: Exclude<PlayStatus, "playing">; count: number } {
  const win = rng() < 0.75;
  switch (rules.type) {
    case "attempts":
      return win ? { status: "won", count: int(rng, 1, rules.maxAttempts) } : { status: "lost", count: rules.maxAttempts };
    case "unlimited":
      return win ? { status: "won", count: int(rng, 1, 25) } : { status: "lost", count: int(rng, 3, 40) };
    case "lives":
      return win ? { status: "won", count: int(rng, 0, rules.lives - 1) } : { status: "lost", count: rules.lives };
    case "points":
      return { status: "done", count: int(rng, 5, 260) };
    case "timed":
    case "quiz": {
      const count = int(rng, Math.floor(rules.total / 4), rules.total);
      return { status: count === rules.total ? "won" : "done", count };
    }
  }
}

interface FakePlay {
  status: Exclude<PlayStatus, "playing">;
  count: number;
  nota: number;
}

/** As partidas do dia, por jogo e por índice da Conta. */
function mockPlays(dateKey: string): Record<string, Map<number, FakePlay>> {
  const rng = createRng(`mock:${dateKey}`);
  const byGame: Record<string, Map<number, FakePlay>> = {};
  for (const { meta } of games) {
    const plays = new Map<number, FakePlay>();
    // Rainhas 10×10 fica vazio, para ver o estado sem ninguém.
    const chance = meta.slug === "rainhas-10" ? 0 : meta.parent ? 0.35 : 0.85;
    accounts.forEach((_, i) => {
      if (i === 0 ? !MY_GAMES.has(meta.slug) : rng() > chance) return;
      const { status, count } = i === 0 && meta.slug === "palavra" ? { status: "won" as const, count: 2 } : fakePlay(meta.rules, rng);
      plays.set(i, { status, count, nota: gradePlay(meta.rules, status, count, 260) });
    });
    byGame[meta.slug] = plays;
  }
  return byGame;
}

/** O Ranking do dia como a API devolve: geral ou de um jogo, de todo mundo ou de um Grupo. */
export function mockBoard(dateKey: string, slug?: string, groupId?: string): Ranking {
  const plays = mockPlays(dateKey);
  const group = GROUPS.find((g) => g.id === groupId);
  const who = group ? group.members : accounts.map((_, i) => i);

  let lines = who.map((i) => {
    if (slug) {
      const play = plays[slug]?.get(i);
      return { i, total: play?.nota ?? 0, played: Boolean(play), count: play?.count ?? null, status: play?.status ?? null };
    }
    const round = roundGames.map((g) => plays[g.meta.slug].get(i)).filter((p) => p !== undefined);
    const total = round.reduce((sum, p) => sum + p.nota, 0);
    return { i, total, played: round.length > 0, count: round.length || null, status: null };
  });
  // Fora de um Grupo só aparece quem jogou; no Grupo, todos os membros.
  if (!group) lines = lines.filter((l) => l.played);
  // `?mock=1st`: o "você" passa à frente em todo ranking, para ver a tela do 1º lugar.
  if (new URLSearchParams(window.location.search).get("mock") === "1st") {
    const best = Math.max(0, ...lines.map((l) => l.total));
    const won = slug ? ("won" as const) : null;
    lines = lines.filter((l) => l.i !== 0);
    lines.push({ i: 0, total: best + 1, played: true, count: 1, status: won });
  }
  lines.sort((a, b) => b.total - a.total || a.i - b.i);

  const totals = [...new Set(lines.map((l) => l.total))];
  const rows: RankingRow[] = lines.map((l) => ({
    position: totals.indexOf(l.total) + 1,
    account: accounts[l.i],
    total: l.total,
    value: l.total,
    played: l.played,
    count: l.count,
    status: l.status,
  }));
  return { rows: rows.slice(0, 100), me: rows.find((r) => r.account.id === MOCK_ME.id) ?? null, participants: rows.length };
}

export function mockGroups(): GroupSummary[] {
  return GROUPS.map(({ id, name, members }) => ({
    id,
    name,
    inviteCode: `${id}2026`,
    memberCount: members.length,
    isOwner: id === "familia",
  }));
}

export function mockGroup(id: string): GroupDetail | null {
  const group = GROUPS.find((g) => g.id === id);
  const summary = mockGroups().find((g) => g.id === id);
  if (!group || !summary) return null;
  return {
    ...summary,
    ownerId: summary.isOwner ? MOCK_ME.id : accounts[group.members[1]].id,
    members: group.members.map((i) => ({ ...accounts[i], joinedAt: new Date("2026-10-22T12:00:00Z") })),
  };
}
