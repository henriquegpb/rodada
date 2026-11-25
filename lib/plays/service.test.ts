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

const { closeStalePlays, modeForPastDay, nextPracticeKey, pastDays, peekPlay, pendingDays, startPlay, submitGuess } =
  await import("./service");
const { archiveStore, dailyStore, practiceStore } = await import("./store");
const { engine } = await import("@/games/palavra/engine");
const { EPOCH_DATE } = await import("@/lib/daily/date");

const TODAY = "2026-10-22";

/** Limpa pelo próprio armazenamento: ele guarda um cache em memória além do localStorage. */
function clearStores() {
  for (const store of [dailyStore, archiveStore, practiceStore]) {
    for (const p of Object.values(store.getPlays())) store.deletePlay(p.slug, p.dateKey);
  }
  memory.clear();
}

describe("treino (Jogar outra)", () => {
  beforeEach(clearStores);

  it("fica guardado à parte e não mexe nas partidas do dia", async () => {
    const answer = engine.createChallenge(TODAY).answer;
    await submitGuess("palavra", TODAY, answer);
    expect(dailyStore.getPlay("palavra", TODAY)?.status).toBe("won");

    const key = nextPracticeKey("palavra");
    expect(key).not.toBe(TODAY);
    const practiceAnswer = engine.createChallenge(key).answer;
    const result = await submitGuess("palavra", key, practiceAnswer, "practice");
    expect(result).toMatchObject({ play: { status: "won", practice: true, archive: false } });

    // As partidas do dia (fonte de sequência e estatísticas) seguem só com o desafio de hoje.
    expect(Object.keys(dailyStore.getPlays())).toEqual([`palavra:${TODAY}`]);
    expect(practiceStore.getPlay("palavra", key)?.status).toBe("won");
  });

  it("o desafio do dia continua encerrado depois do treino", async () => {
    await submitGuess("palavra", TODAY, engine.createChallenge(TODAY).answer);
    await submitGuess("palavra", nextPracticeKey("palavra"), "carro", "practice");
    const daily = await startPlay("palavra", TODAY);
    expect(daily).toMatchObject({ status: "won", practice: false });
    expect(await submitGuess("palavra", TODAY, "pedra")).toEqual({ error: "Você já jogou hoje" });
  });

  it("continua o treino em andamento em vez de sortear outro", async () => {
    const key = nextPracticeKey("palavra");
    await submitGuess("palavra", key, "carro", "practice");
    expect(nextPracticeKey("palavra")).toBe(key);
  });

  it("só usa dias antes da estreia do Rodada: nunca o desafio de um dia de verdade", () => {
    for (let i = 0; i < 200; i++) expect(nextPracticeKey("palavra") < EPOCH_DATE).toBe(true);
  });

  it("depois de um treino, vai para o dia seguinte (dias seguidos não repetem)", async () => {
    await submitGuess("palavra", "2010-05-01", engine.createChallenge("2010-05-01").answer, "practice");
    expect(nextPracticeKey("palavra")).toBe("2010-05-02");
  });

  it("guarda só o treino mais recente de cada jogo", async () => {
    const first = nextPracticeKey("palavra");
    await submitGuess("palavra", first, engine.createChallenge(first).answer, "practice");
    const second = nextPracticeKey("palavra");
    await submitGuess("palavra", second, "carro", "practice");
    expect(Object.keys(practiceStore.getPlays())).toEqual([`palavra:${second}`]);
  });

  it("descarta a partida salva se o desafio mudou desde que ela foi jogada", async () => {
    const answer = engine.createChallenge(TODAY).answer;
    await submitGuess("palavra", TODAY, "carro");
    // Simula um desafio antigo: as cores salvas não batem com a resposta de hoje.
    const stale = dailyStore.getPlay("palavra", TODAY)!;
    dailyStore.savePlay({
      ...stale,
      guesses: [{ input: "carro", feedback: { letters: [..."carro"], marks: ["correct", "correct", "correct", "correct", "absent"] } }],
    });
    const play = await startPlay("palavra", TODAY);
    expect(play.guesses).toEqual([]);
    expect(dailyStore.getPlay("palavra", TODAY)).toBeUndefined();
    // E dá para jogar de novo normalmente.
    expect(await submitGuess("palavra", TODAY, answer)).toMatchObject({ play: { status: "won" } });
  });

  it("mantém a partida salva quando ela bate com o desafio", async () => {
    await submitGuess("palavra", TODAY, "carro");
    await submitGuess("palavra", TODAY, "pedra");
    expect((await startPlay("palavra", TODAY)).guesses).toHaveLength(2);
  });

  it("peekPlay só lê: ignora a partida velha sem apagar e sem avisar ninguém", async () => {
    await submitGuess("palavra", TODAY, "carro");
    const stale = dailyStore.getPlay("palavra", TODAY)!;
    dailyStore.savePlay({
      ...stale,
      guesses: [{ input: "carro", feedback: { letters: [..."carro"], marks: ["correct", "correct", "correct", "correct", "absent"] } }],
    });
    // Roda durante o render: gravar ali avisaria outros componentes no meio dele.
    const before = dailyStore.getPlays();
    expect(peekPlay("palavra", TODAY)?.guesses).toEqual([]);
    expect(dailyStore.getPlays()).toBe(before);
    // A limpeza fica para o startPlay.
    await startPlay("palavra", TODAY);
    expect(dailyStore.getPlay("palavra", TODAY)).toBeUndefined();
  });
});

describe("virada do dia", () => {
  const YESTERDAY = "2026-10-21";

  beforeEach(clearStores);

  it("a partida de ontem que ficou no meio vira desistência; a de hoje segue", async () => {
    await submitGuess("palavra", YESTERDAY, "carro");
    await submitGuess("palavra", TODAY, "carro");
    await closeStalePlays(TODAY);

    const yesterday = dailyStore.getPlay("palavra", YESTERDAY)!;
    expect(yesterday).toMatchObject({ status: "lost", answerLabel: expect.any(String), finishedAt: expect.any(String) });
    expect(yesterday.guesses).toHaveLength(1);
    expect(dailyStore.getPlay("palavra", TODAY)?.status).toBe("playing");
  });

  it("não mexe nas partidas de ontem que já terminaram", async () => {
    await submitGuess("palavra", YESTERDAY, engine.createChallenge(YESTERDAY).answer);
    const before = dailyStore.getPlay("palavra", YESTERDAY);
    await closeStalePlays(TODAY);
    expect(dailyStore.getPlay("palavra", YESTERDAY)).toEqual(before);
  });
});

describe("dias anteriores", () => {
  const LATER = "2026-10-25";

  beforeEach(clearStores);

  it("vão da estreia do jogo até ontem, do mais recente ao mais antigo", () => {
    expect(pastDays("palavra", LATER)).toEqual(["2026-10-24", "2026-10-23", "2026-10-22"]);
    expect(pastDays("palavra", EPOCH_DATE)).toEqual([]);
    // O Incomum estreou depois: no dia da estreia ainda não tem dia anterior.
    expect(pastDays("incomum", "2026-11-24")).toEqual([]);
    expect(pastDays("incomum", "2026-11-26")).toEqual(["2026-11-25", "2026-11-24"]);
  });

  it("jogado depois fica salvo à parte, fora das partidas do dia", async () => {
    const day = "2026-10-24";
    const result = await submitGuess("palavra", day, engine.createChallenge(day).answer, "archive");
    expect(result).toMatchObject({ play: { status: "won", archive: true, practice: false } });
    expect(archiveStore.getPlay("palavra", day)?.status).toBe("won");
    expect(dailyStore.getPlay("palavra", day)).toBeUndefined();
    // Volta a abrir terminado.
    expect(await startPlay("palavra", day, "archive")).toMatchObject({ status: "won", archive: true });
  });

  it("guarda todos os dias jogados, não só o último", async () => {
    for (const day of ["2026-10-24", "2026-10-23"]) await submitGuess("palavra", day, "carro", "archive");
    expect(Object.keys(archiveStore.getPlays()).sort()).toEqual(["palavra:2026-10-23", "palavra:2026-10-24"]);
  });

  it("o treino só libera sem dia anterior por terminar; vale o jogado no dia ou depois", async () => {
    const pending = () => pendingDays(dailyStore.getPlays(), archiveStore.getPlays(), "palavra", LATER);
    expect(pending()).toEqual(["2026-10-24", "2026-10-23", "2026-10-22"]);

    // Jogado no próprio dia: abre a partida do dia, que já conta como feita.
    await submitGuess("palavra", "2026-10-23", engine.createChallenge("2026-10-23").answer);
    expect(modeForPastDay("palavra", "2026-10-23")).toBe("daily");
    expect(modeForPastDay("palavra", "2026-10-24")).toBe("archive");
    // Começado e não terminado ainda falta.
    await submitGuess("palavra", "2026-10-24", "carro", "archive");
    expect(pending()).toEqual(["2026-10-24", "2026-10-22"]);

    await submitGuess("palavra", "2026-10-24", engine.createChallenge("2026-10-24").answer, "archive");
    await submitGuess("palavra", "2026-10-22", engine.createChallenge("2026-10-22").answer, "archive");
    expect(pending()).toEqual([]);
  });
});
