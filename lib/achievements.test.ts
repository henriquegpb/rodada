import { describe, expect, it } from "vitest";
import { roundGames } from "@/games";
import { EMPTY_COUNTERS, LEVELS, achievementProgress, achievements, levelUps, type Counters } from "./achievements";

const progressOf = (id: string, counters: Counters) => achievementProgress(counters).find((p) => p.id === id)!;

describe("registro de Conquistas", () => {
  it("ids são únicos e limiares crescem de Bronze a Diamante", () => {
    expect(new Set(achievements.map((a) => a.id)).size).toBe(achievements.length);
    for (const a of achievements) {
      expect(a.thresholds).toHaveLength(LEVELS.length);
      for (let i = 1; i < a.thresholds.length; i++) expect(a.thresholds[i]).toBeGreaterThan(a.thresholds[i - 1]);
    }
  });

  it("tem Fiel e Perfeito para cada jogo da Rodada", () => {
    for (const { meta } of roundGames) {
      expect(achievements.some((a) => a.id === `fiel-${meta.slug}`)).toBe(true);
      expect(achievements.some((a) => a.id === `perfeito-${meta.slug}`)).toBe(true);
    }
  });
});

describe("Nível", () => {
  it("começa sem Nível e mostra o Bronze como próximo", () => {
    expect(progressOf("dias-jogados", EMPTY_COUNTERS)).toMatchObject({ level: null, value: 0, next: 7 });
  });

  it("sobe exatamente no limiar", () => {
    const at = (daysPlayed: number) => progressOf("dias-jogados", { ...EMPTY_COUNTERS, daysPlayed });
    expect(at(6).level).toBe(null);
    expect(at(7)).toMatchObject({ level: "bronze", next: 30 });
    expect(at(30)).toMatchObject({ level: "prata", next: 100 });
    expect(at(364)).toMatchObject({ level: "ouro", next: 365 });
    expect(at(365)).toMatchObject({ level: "diamante", next: null });
  });

  it("lê contadores por jogo", () => {
    const counters = { ...EMPTY_COUNTERS, byGame: { palavra: { plays: 50, perfect: 1 } } };
    expect(progressOf("fiel-palavra", counters).level).toBe("prata");
    expect(progressOf("perfeito-palavra", counters).level).toBe("bronze");
    expect(progressOf("fiel-elo", counters).level).toBe(null);
  });

  it("o bicho mais fundo do Incomum sai do recorde de pontos, um bicho a cada 70", () => {
    const at = (best: number) => progressOf("fundo-incomum", { ...EMPTY_COUNTERS, byGame: { incomum: { plays: 1, perfect: 0, best } } });
    expect(at(200)).toMatchObject({ value: 2, level: null, next: 3 });
    expect(at(210)).toMatchObject({ value: 3, level: "bronze" });
    expect(at(360)).toMatchObject({ value: 5, level: "prata" });
    expect(at(630)).toMatchObject({ value: 9, level: "diamante", next: null });
    // Contadores gravados antes do recorde existir: sem bicho, sem erro.
    expect(progressOf("fundo-incomum", { ...EMPTY_COUNTERS, byGame: { incomum: { plays: 3, perfect: 0 } } }).value).toBe(0);
    const label = achievements.find((a) => a.id === "fundo-incomum")!.label!;
    expect([label(0), label(5), label(10)]).toEqual(["Nenhum ainda", "Peixe-diabo", "Fundo da fossa"]);
  });
});

describe("levelUps", () => {
  it("lista só o que mudou de Nível", () => {
    const before = { ...EMPTY_COUNTERS, daysPlayed: 6, maxStreak: 6 };
    const after = { ...before, daysPlayed: 7, fullRounds: 1 };
    expect(levelUps(before, after).map((u) => [u.id, u.level])).toEqual([
      ["dias-jogados", "bronze"],
      ["rodada-completa", "bronze"],
    ]);
    expect(levelUps(after, after)).toEqual([]);
  });
});
