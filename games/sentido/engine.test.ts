import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/daily/date";
import type { Guess } from "../types";
import near from "./data/near.json";
import data from "./data/words.json";
import { ANSWERS, engine, resolveWord } from "./engine";
import { HINT, shareGrid } from "./rank";
import type { SentidoFeedback } from "./types";

const DAY = "2026-10-29";

/** Chuta as palavras em ordem e devolve os chutes aceitos. */
function play(answer: string, inputs: string[]) {
  const previous: Guess<SentidoFeedback>[] = [];
  for (const input of inputs) {
    const result = engine.checkGuess(input, answer, previous);
    if (!result.ok) throw new Error(result.error);
    previous.push({ input, feedback: result.feedback });
  }
  return previous;
}

describe("engine Sentido", () => {
  it("palavra do dia determinística e diferente no dia seguinte", () => {
    expect(engine.createChallenge(DAY)).toEqual(engine.createChallenge(DAY));
    expect(engine.createChallenge(addDays(DAY, 1)).answer).not.toBe(engine.createChallenge(DAY).answer);
  });

  it("a resposta é a 1 e resolve; vizinhas de sentido ficam perto, palavras soltas longe", () => {
    const [ponte, tunel, redacao, viaduto] = play("viaduto", ["ponte", "túnel", "redação", "viaduto"]).map((g) => g.feedback);
    expect(viaduto).toEqual({ word: "viaduto", rank: 1 });
    expect(engine.checkGuess("viaduto", "viaduto", [])).toMatchObject({ ok: true, solved: true });
    expect(ponte.rank).toBeLessThan(50);
    expect(tunel.rank).toBeLessThan(50);
    expect(redacao.rank).toBeGreaterThan(3000);
  });

  it("cada palavra do vocabulário tem uma posição diferente", () => {
    const ranks = new Set(
      data.words.slice(0, 3000).map((w) => {
        const r = engine.checkGuess(w, "praia", []);
        return r.ok ? r.feedback.rank : 0;
      }),
    );
    expect(ranks.size).toBe(3000);
    expect(ranks.has(0)).toBe(false);
  });

  it("acento é opcional, a não ser que separe duas palavras", () => {
    expect(resolveWord("cafe")).toEqual({ word: "café" });
    expect(resolveWord("Túnel")).toEqual({ word: "túnel" });
    expect(resolveWord("coco")).toEqual({ word: "coco" });
    expect(resolveWord("cocô")).toEqual({ word: "cocô" });
    expect(resolveWord("avó")).toEqual({ word: "avó" });
    expect(resolveWord("avô")).toEqual({ word: "avô" });
  });

  it("plural, feminino e verbo conjugado viram o lema; o resto é recusado sem gastar a vez", () => {
    expect(resolveWord("carros")).toEqual({ word: "carro" });
    expect(resolveWord("bonitas")).toEqual({ word: "bonito" });
    expect(resolveWord("correndo")).toEqual({ word: "correr" });
    expect(resolveWord("meses")).toEqual({ word: "mês" });
    expect(resolveWord("vai")).toEqual({ word: "ir" });
    expect(engine.checkGuess("xyzabc", "praia", [])).toMatchObject({ ok: false });
    expect(engine.checkGuess("casa amarela", "praia", [])).toMatchObject({ ok: false });
  });

  it("repetir a mesma palavra, mesmo em outra forma, não conta", () => {
    const previous = play("praia", ["carro"]);
    expect(engine.checkGuess("carros", "praia", previous)).toMatchObject({ ok: false });
  });

  it("dicas chegam cada vez mais perto, sem repetir e sem entregar a resposta", () => {
    const hints = play("praia", Array(12).fill(HINT)).map((g) => g.feedback);
    expect(hints.every((h) => h.hint && h.rank > 1)).toBe(true);
    expect(new Set(hints.map((h) => h.word)).size).toBe(hints.length);
    for (let i = 1; i < hints.length; i++) expect(hints[i].rank).toBeLessThan(hints[i - 1].rank);
    // Com um chute bom, a dica fica mais perto que ele.
    const [guess, hint] = play("praia", ["areia", HINT]).map((g) => g.feedback);
    expect(hint.rank).toBeLessThan(guess.rank);
  });

  it("compartilhamento conta os chutes por faixa e as dicas", () => {
    const guesses = play("viaduto", ["ponte", "carro", "redação", HINT, "viaduto"]);
    const text = shareGrid({ slug: "sentido", dateKey: DAY, number: 1, puzzle: {}, guesses, status: "won" });
    expect(text).toContain("🟩");
    expect(text).toContain("🟥");
    expect(text).toContain("💡 1 dica");
  });
});

describe("dados do Sentido", () => {
  const index = new Map(data.words.map((w, i) => [w, i]));

  it("toda resposta está no vocabulário, é comum e tem a lista exata de vizinhas", () => {
    const nearest: Record<string, string> = near;
    for (const answer of ANSWERS) {
      expect(index.get(answer), answer).toBeLessThan(12_000);
      expect(nearest[answer], answer).toBeTruthy();
    }
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length);
  });

  it("sem grafia anterior ao acordo nem uso só de Portugal, que poderiam virar dica", () => {
    for (const w of ["projecção", "acção", "tecto", "ecrã"]) expect(index.has(w), w).toBe(false);
    expect(index.has("mapa")).toBe(true);
  });

  it("vetores e vocabulário têm o mesmo tamanho", () => {
    expect(atob(data.vectors).length).toBe(data.words.length * data.dims);
    expect(data.words.length).toBeLessThan(65_536);
  });
});
