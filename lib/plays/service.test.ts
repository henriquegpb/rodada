import { beforeEach, describe, expect, it } from "vitest";

// O serviço guarda no localStorage: um substituto em memória basta para os testes.
const memory = new Map<string, string>();
Object.assign(globalThis, {
  window: { addEventListener() {}, removeEventListener() {} },
  localStorage: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
  },
});

const { startPlay, submitGuess, nextPracticeKey } = await import("./service");
const { dailyStore, practiceStore } = await import("./store");
const { engine } = await import("@/games/palavra/engine");

const TODAY = "2026-10-22";

describe("treino (Jogar outra)", () => {
  beforeEach(() => memory.clear());

  it("fica guardado à parte e não mexe nas partidas do dia", async () => {
    const answer = engine.createChallenge(TODAY).answer;
    await submitGuess("palavra", TODAY, answer);
    expect(dailyStore.getPlay("palavra", TODAY)?.status).toBe("won");

    const key = nextPracticeKey("palavra");
    expect(key).not.toBe(TODAY);
    const practiceAnswer = engine.createChallenge(key).answer;
    const result = await submitGuess("palavra", key, practiceAnswer, true);
    expect(result).toMatchObject({ play: { status: "won", practice: true } });

    // As partidas do dia (fonte de sequência e estatísticas) seguem só com o desafio de hoje.
    expect(Object.keys(dailyStore.getPlays())).toEqual([`palavra:${TODAY}`]);
    expect(practiceStore.getPlay("palavra", key)?.status).toBe("won");
  });

  it("o desafio do dia continua encerrado depois do treino", async () => {
    await submitGuess("palavra", TODAY, engine.createChallenge(TODAY).answer);
    await submitGuess("palavra", nextPracticeKey("palavra"), "carro", true);
    const daily = await startPlay("palavra", TODAY);
    expect(daily).toMatchObject({ status: "won", practice: false });
    expect(await submitGuess("palavra", TODAY, "pedra")).toEqual({ error: "Você já jogou hoje" });
  });

  it("continua o treino em andamento em vez de sortear outro", async () => {
    const key = nextPracticeKey("palavra");
    await submitGuess("palavra", key, "carro", true);
    expect(nextPracticeKey("palavra")).toBe(key);
  });

  it("guarda só o treino mais recente de cada jogo", async () => {
    const first = nextPracticeKey("palavra");
    await submitGuess("palavra", first, engine.createChallenge(first).answer, true);
    const second = nextPracticeKey("palavra");
    await submitGuess("palavra", second, "carro", true);
    expect(Object.keys(practiceStore.getPlays())).toEqual([`palavra:${second}`]);
  });
});
