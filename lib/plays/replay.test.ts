import { describe, expect, it } from "vitest";
import { engine as palavra } from "@/games/palavra/engine";
import { engine as capital } from "@/games/capital/engine";
import { engine as colmeia } from "@/games/colmeia/engine";
import type { GameRules } from "@/games/types";
import { replayPlay } from "./replay";

const DAY = "2026-10-22";
const attempts: GameRules = { type: "attempts", maxAttempts: 6 };

describe("replayPlay", () => {
  const { answer } = palavra.createChallenge(DAY);
  const wrong = ["sabia", "porta", "mundo", "carta", "festa", "livro"].filter((w) => w !== answer);

  it("refaz uma vitória e conta as tentativas", () => {
    const result = replayPlay(palavra, attempts, answer, [wrong[0], answer], false);
    expect(result).toMatchObject({ ok: true, status: "won", count: 2 });
  });

  it("acabar as tentativas é derrota", () => {
    const result = replayPlay(palavra, attempts, answer, wrong.slice(0, 6), false);
    expect(result).toMatchObject({ ok: true, status: "lost", count: 6 });
  });

  it("recusa chute que a engine recusa", () => {
    expect(replayPlay(palavra, attempts, answer, ["xxxxx"], false)).toMatchObject({ ok: false });
  });

  it("recusa chute depois do fim", () => {
    expect(replayPlay(palavra, attempts, answer, [answer, wrong[0]], false)).toMatchObject({ ok: false });
  });

  it("recusa partida que não terminou, a menos que a pessoa tenha desistido", () => {
    expect(replayPlay(palavra, attempts, answer, [wrong[0]], false)).toMatchObject({ ok: false });
    expect(replayPlay(palavra, attempts, answer, [wrong[0]], true)).toMatchObject({ ok: true, status: "lost" });
  });

  it("quiz termina na última resposta e conta acertos", () => {
    const { answer: questions } = capital.createChallenge(DAY);
    const rules: GameRules = { type: "quiz", total: 10 };
    const inputs = Array.from({ length: 10 }, () => ""); // pular conta como erro
    expect(replayPlay(capital, rules, questions, inputs, false)).toMatchObject({ ok: true, status: "done", count: 0 });
  });

  it("encerrar a Colmeia fica com os pontos que tinha", () => {
    const { answer: entry } = colmeia.createChallenge(DAY);
    const result = replayPlay(colmeia, { type: "points" }, entry, [entry.words[0]], true);
    expect(result).toMatchObject({ ok: true, status: "done" });
    expect(result.ok && result.count).toBeGreaterThan(0);
  });
});
