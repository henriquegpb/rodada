import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { formatResult, playCount } from "@/lib/plays/result";
import type { Guess } from "../types";
import {
  CATEGORIES,
  engine,
  findAnswer,
  loadCategory,
  setItemsLoader,
  type IncomumAnswer,
  type IncomumItems,
} from "./engine";
import { incomum } from "./index";
import { answerKey, editDistance, suggestionIn, suggestionMessage } from "./match";
import { MAX_POINTS, ROUND, SKIP, TIERS, TIMEOUT, rareStart, tierOf } from "./tiers";
import type { IncomumCategoryRef, IncomumFeedback } from "./types";

const CITIES: IncomumItems = [
  ["Curitiba", "CWB"],
  ["Londrina"],
  ["Foz do Iguaçu", "Foz"],
  ...Array.from({ length: 96 }, (_, i) => [`Cidade ${i}`]),
  ["Cianorte"],
];

const REF: IncomumCategoryRef = {
  id: "teste",
  title: "Cidade do Paraná",
  total: CITIES.length,
  obvious: "Curitiba",
  rare: ["Cidade 77"],
  v: "1",
};

const ANSWER: IncomumAnswer = {
  categories: Array.from({ length: ROUND }, () => REF),
};

/** As respostas de verdade, lidas do disco em vez de baixadas. */
const fromDisk = async (ref: IncomumCategoryRef): Promise<IncomumItems> =>
  ref.id === REF.id
    ? CITIES
    : JSON.parse(readFileSync(join(process.cwd(), "public/incomum", `${ref.id}.json`), "utf8"));

beforeAll(async () => {
  setItemsLoader(fromDisk);
  await loadCategory(REF);
});

function play(inputs: string[]) {
  const previous: Guess<IncomumFeedback>[] = [];
  let last;
  for (const input of inputs) {
    last = engine.checkGuess(input, ANSWER, previous);
    if (!last.ok) throw new Error(last.error);
    previous.push({ input, feedback: last.feedback });
  }
  return { previous, last: last! };
}

describe("answerKey", () => {
  it("ignora acento, maiúscula, pontuação, espaço, parênteses e artigo", () => {
    expect(answerKey("Foz do Iguaçu")).toBe("fozdoiguacu");
    expect(answerKey("  foz-do-iguacu ")).toBe("fozdoiguacu");
    expect(answerKey("Cascavel (Paraná)")).toBe("cascavel");
    expect(answerKey("O Exterminador do Futuro")).toBe(answerKey("exterminador do futuro"));
    expect(answerKey("Br'oz")).toBe("broz");
  });

  it("editDistance para assim que passa do limite", () => {
    expect(editDistance("curitiba", "curitba", 2)).toBe(1);
    expect(editDistance("curitiba", "londrina", 2)).toBe(3);
  });
});

describe("findAnswer", () => {
  it("acha exato pelo nome e pelo apelido, sem contar acento, maiúscula e hífen", () => {
    expect(findAnswer(CITIES, "curitiba")).toEqual({ item: 0, name: "Curitiba", exact: true });
    expect(findAnswer(CITIES, "cwb")).toMatchObject({ item: 0, exact: true });
    expect(findAnswer(CITIES, "foz-do-iguacu")).toMatchObject({ item: 2, exact: true });
  });

  it("com letra errada, sugere o nome da lista em vez de aceitar", () => {
    expect(findAnswer(CITIES, "Curitba")).toEqual({ item: 0, name: "Curitiba", exact: false });
    expect(findAnswer(CITIES, "Cianortee")).toEqual({ item: 99, name: "Cianorte", exact: false });
    expect(findAnswer(CITIES, "Foz do Iguasu")).toMatchObject({ item: 2, name: "Foz do Iguaçu", exact: false });
  });

  it("não sugere o que não parece nada da lista nem nome curto com letra errada", () => {
    expect(findAnswer(CITIES, "Maringá")).toBeNull();
    expect(findAnswer(CITIES, "cwa")).toBeNull();
    expect(findAnswer(CITIES, "x")).toBeNull();
  });
});

describe("sugestão", () => {
  it("a recusa traz o nome, e mandar o nome sugerido vale", () => {
    const result = engine.checkGuess("Curitba", ANSWER, []);
    expect(result).toEqual({ ok: false, error: suggestionMessage("Curitiba") });
    if (result.ok) return;
    expect(suggestionIn(result.error)).toBe("Curitiba");
    expect(engine.checkGuess(suggestionIn(result.error)!, ANSWER, []).ok).toBe(true);
  });

  it("recusa sem sugestão não tem nome", () => {
    expect(suggestionIn("Essa não está na lista. Tenta outra!")).toBeNull();
  });
});

describe("tierOf", () => {
  it("a primeira é óbvia e a última raríssima", () => {
    expect(tierOf(0, 100)).toBe(0);
    expect(tierOf(99, 100)).toBe(TIERS.length - 1);
  });

  it("numa lista de 100: 3 óbvias, até a 15ª comum, até a 45ª boa, até a 80ª rara", () => {
    expect([2, 3, 14, 15, 44, 45, 79, 80].map((i) => tierOf(i, 100))).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });

  it("lista curta: a primeira ainda é óbvia", () => {
    expect(tierOf(0, 5)).toBe(0);
    expect(tierOf(1, 5)).toBeGreaterThan(0);
  });
});

describe("engine", () => {
  it("cada resposta vai para a categoria da vez, com a faixa e os pontos", () => {
    const { previous } = play(["Curitiba", "Cianorte"]);
    expect(previous[0].feedback).toMatchObject({
      answer: "Curitiba",
      tier: 0,
      points: 10,
      rank: 1,
      obvious: "Curitiba",
    });
    expect(previous[1].feedback).toMatchObject({
      answer: "Cianorte",
      tier: 4,
      points: 100,
      rank: 100,
      total: 100,
    });
  });

  it("resposta fora da lista é recusada sem gastar a categoria", () => {
    const result = engine.checkGuess("Maringá", ANSWER, []);
    expect(result.ok).toBe(false);
  });

  it("pular ou deixar o tempo acabar vale 0 e passa para a próxima", () => {
    const { previous } = play([SKIP, TIMEOUT]);
    expect(previous[0].feedback).toMatchObject({
      answer: null,
      tier: -1,
      points: 0,
      missed: "skip",
    });
    expect(previous[1].feedback).toMatchObject({
      answer: null,
      tier: -1,
      points: 0,
      missed: "time",
    });
  });

  it("a última categoria encerra a partida e o placar soma os pontos", () => {
    const { previous, last } = play(["Curitiba", "Cianorte", SKIP, "Foz", "Londrina", "Cidade 50", "Cidade 95"]);
    expect(last.ok && last.solved).toBe(true);
    const count = playCount(incomum.meta.rules, previous);
    expect(count).toBe(previous.reduce((s, g) => s + g.feedback.points, 0));
    expect(formatResult(incomum.meta.rules, "won", count)).toBe(`${count} pts`);
    expect(engine.checkGuess("Curitiba", ANSWER, previous).ok).toBe(false);
  });

  it("as raríssimas começam na primeira da última faixa", () => {
    expect(CITIES[rareStart(CITIES.length)][0]).toBe("Cidade 77");
    expect(tierOf(rareStart(CITIES.length) - 1, CITIES.length)).toBe(TIERS.length - 2);
  });

  it("sem as respostas baixadas, recusa sem gastar a categoria", () => {
    const other = { ...REF, id: "outra" };
    const result = engine.checkGuess("Curitiba", { categories: [other] }, []);
    expect(result.ok).toBe(false);
  });

  it("o desafio do dia tem 7 categorias diferentes, de verdade, e é o mesmo para a mesma data", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(ROUND);
    const a = engine.createChallenge("2026-11-24");
    const b = engine.createChallenge("2026-11-24");
    expect(a.puzzle).toEqual(b.puzzle);
    expect(new Set(a.puzzle.categories.map((c) => c.title)).size).toBe(ROUND);
    expect(engine.maxPoints!(a.puzzle)).toBe(MAX_POINTS);
  });

  it("depois de preparar o dia, a resposta mais óbvia de cada categoria é aceita", async () => {
    const day = "2026-11-24";
    expect(engine.isReady!(day)).toBe(false);
    await engine.prepare!(day);
    expect(engine.isReady!(day)).toBe(true);
    const { answer } = engine.createChallenge(day);
    const previous: Guess<IncomumFeedback>[] = [];
    for (const category of answer.categories) {
      const result = engine.checkGuess(category.obvious, answer, previous);
      expect(result.ok && result.feedback.rank).toBe(1);
      if (result.ok) previous.push({ input: category.obvious, feedback: result.feedback });
    }
  });

  it("todo arquivo do índice existe, tem o total certo e começa pela mais óbvia", async () => {
    for (const ref of CATEGORIES) {
      const items = await fromDisk(ref);
      expect(items.length, ref.id).toBe(ref.total);
      expect(items[0][0], ref.id).toBe(ref.obvious);
      expect(findAnswer(items, ref.obvious)?.item, ref.id).toBe(0);
    }
  });
});
