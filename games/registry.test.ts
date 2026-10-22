import { describe, expect, it } from "vitest";
import { engineSlugs, loadEngine } from "./engines";
import { games } from "./index";

describe("registro de jogos", () => {
  it("todo jogo registrado em index.ts tem engine em engines.ts e vice-versa", () => {
    expect(games.map((g) => g.meta.slug).sort()).toEqual([...engineSlugs].sort());
  });

  it("slugs são únicos e servem de URL", () => {
    const slugs = games.map((g) => g.meta.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(games.map((g) => [g.meta.slug, g] as const))("%s gera desafio e compartilhamento", async (slug, game) => {
    const engine = await loadEngine(slug);
    const { puzzle } = engine.createChallenge("2026-10-22");
    const grid = game.shareGrid({ slug, dateKey: "2026-10-22", number: 22, puzzle, guesses: [], status: "playing" });
    expect(typeof grid).toBe("string");
  });
});
