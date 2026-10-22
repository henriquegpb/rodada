import { describe, expect, it } from "vitest";
import type { GameRules } from "@/games/types";
import { computeStreak, gameStats, overallStreak, type PlayRecord } from "./stats";
import { scorePlay } from "./scoring";
import { countsForStreak, formatResult } from "./plays/result";

const SIX: GameRules = { type: "attempts", maxAttempts: 6 };
const TIMED: GameRules = { type: "timed", seconds: 900, total: 197 };

const play = (dateKey: string, status: PlayRecord["status"], count = 3, slug = "palavra"): PlayRecord => ({
  slug,
  dateKey,
  status,
  count,
});

describe("formatResult", () => {
  it("tentativas: n/max ao ganhar, X/max ao perder", () => {
    expect(formatResult(SIX, "won", 3)).toBe("3/6");
    expect(formatResult(SIX, "lost", 6)).toBe("X/6");
  });

  it("tempo: achados/total", () => {
    expect(formatResult(TIMED, "done", 142)).toBe("142/197");
    expect(formatResult(TIMED, "won", 197)).toBe("197/197");
  });
});

describe("regras sem limite", () => {
  const OPEN: GameRules = { type: "unlimited" };
  it("placar, pontos e sequência", () => {
    expect(formatResult(OPEN, "won", 8)).toBe("8 chutes");
    expect(formatResult(OPEN, "won", 1)).toBe("1 chute");
    expect(formatResult(OPEN, "lost", 12)).toBe("X");
    expect(scorePlay(OPEN, "won", 1)).toBe(10);
    expect(scorePlay(OPEN, "won", 30)).toBe(1);
    expect(scorePlay(OPEN, "lost", 5)).toBe(0);
    expect(countsForStreak(OPEN, "lost")).toBe(false);
  });

  it("melhor = menos chutes, só entre vitórias", () => {
    const plays = [play("2026-10-21", "won", 9, "calor"), play("2026-10-22", "won", 4, "calor"), play("2026-10-20", "lost", 2, "calor")];
    expect(gameStats(plays, "calor", OPEN, "2026-10-22")).toMatchObject({ best: 4, average: 7 });
  });
});

describe("scorePlay", () => {
  it("tentativas: menos tentativas = mais pontos; derrota = 0", () => {
    expect(scorePlay(SIX, "won", 1)).toBe(6);
    expect(scorePlay(SIX, "won", 6)).toBe(1);
    expect(scorePlay(SIX, "lost", 6)).toBe(0);
  });

  it("tempo: um ponto por item achado", () => {
    expect(scorePlay(TIMED, "done", 142)).toBe(142);
  });
});

describe("countsForStreak", () => {
  it("tentativas só contam vitória; tempo conta qualquer partida terminada", () => {
    expect(countsForStreak(SIX, "won")).toBe(true);
    expect(countsForStreak(SIX, "lost")).toBe(false);
    expect(countsForStreak(TIMED, "done")).toBe(true);
    expect(countsForStreak(TIMED, "playing")).toBe(false);
  });
});

describe("computeStreak", () => {
  const days = (entries: [string, boolean][]) => new Map(entries);

  it("conta dias seguidos até hoje", () => {
    const d = days([
      ["2026-10-20", true],
      ["2026-10-21", true],
      ["2026-10-22", true],
    ]);
    expect(computeStreak(d, "2026-10-22")).toEqual({ current: 3, max: 3 });
  });

  it("quem jogou ontem e ainda não jogou hoje mantém a sequência", () => {
    const d = days([
      ["2026-10-20", true],
      ["2026-10-21", true],
    ]);
    expect(computeStreak(d, "2026-10-22").current).toBe(2);
  });

  it("um dia sem jogar zera a atual mas mantém o recorde", () => {
    const d = days([
      ["2026-10-15", true],
      ["2026-10-16", true],
      ["2026-10-17", true],
      ["2026-10-21", true],
    ]);
    expect(computeStreak(d, "2026-10-23")).toEqual({ current: 0, max: 3 });
  });

  it("um dia que não conta (derrota) quebra a sequência", () => {
    const d = days([
      ["2026-10-20", true],
      ["2026-10-21", false],
      ["2026-10-22", true],
    ]);
    expect(computeStreak(d, "2026-10-22")).toEqual({ current: 1, max: 1 });
  });
});

describe("gameStats", () => {
  const plays = [
    play("2026-10-19", "won", 2),
    play("2026-10-20", "won", 4),
    play("2026-10-21", "lost", 6),
    play("2026-10-22", "won", 4),
    play("2026-10-21", "done", 120, "mundo"),
    play("2026-10-22", "done", 150, "mundo"),
  ];

  it("tentativas: vitórias, distribuição e sequência", () => {
    const s = gameStats(plays, "palavra", SIX, "2026-10-22");
    expect(s).toMatchObject({ played: 4, winRate: 75, distribution: [0, 1, 0, 2, 0, 0] });
    expect(s.streak).toEqual({ current: 1, max: 2 });
  });

  it("tempo: melhor, média e sequência de dias jogados", () => {
    const s = gameStats(plays, "mundo", TIMED, "2026-10-22");
    expect(s).toMatchObject({ played: 2, best: 150, average: 135, distribution: [] });
    expect(s.streak).toEqual({ current: 2, max: 2 });
  });

  it("partida em andamento não conta", () => {
    expect(gameStats([play("2026-10-22", "playing", 2)], "palavra", SIX, "2026-10-22").played).toBe(0);
  });

  it("sequência geral conta qualquer jogo terminado, mesmo perdido", () => {
    expect(overallStreak(plays, "2026-10-22")).toEqual({ current: 4, max: 4 });
  });
});
