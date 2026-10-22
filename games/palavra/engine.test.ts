import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/normalize";
import { addDays, EPOCH_DATE } from "@/lib/daily/date";
import { engine, evaluate } from "./engine";
import answers from "./data/answers.json";
import valid from "./data/valid.json";
import type { PalavraFeedback } from "./types";
import type { Guess } from "../types";

describe("evaluate", () => {
  it("marca lugar certo, existe e não existe", () => {
    expect(evaluate("carro", "corda")).toEqual(["correct", "present", "correct", "absent", "present"]);
  });

  it("letra repetida no chute só conta quantas vezes existe na resposta", () => {
    // "salsa" tem dois A: um já é acerto exato no fim, o outro sobra para o primeiro A do chute.
    expect(evaluate("arara", "salsa")).toEqual(["present", "absent", "absent", "absent", "correct"]);
    expect(evaluate("ossos", "tosse")).toEqual(["present", "present", "correct", "absent", "absent"]);
  });

  it("posição certa tem prioridade sobre 'existe' da mesma letra", () => {
    expect(evaluate("lalal", "papel")).toEqual(["absent", "correct", "absent", "absent", "correct"]);
  });
});

describe("checkGuess", () => {
  const check = (input: string, answer: string, previous: Guess<PalavraFeedback>[] = []) =>
    engine.checkGuess(input, answer, previous);

  it("aceita entrada sem acento e devolve a grafia com acento", () => {
    const result = check("lapis", "lápis");
    expect(result).toMatchObject({ ok: true, solved: true });
    if (result.ok) expect(result.feedback.letters.join("")).toBe("lápis");
  });

  it("compara normalizado: cedilha e til não contam como letras diferentes", () => {
    const result = check("caçar", "cacar");
    expect(result.ok && result.feedback.marks.every((m) => m === "correct")).toBe(true);
  });

  it("recusa palavras com tamanho errado sem gastar tentativa", () => {
    expect(check("casa", "mesas")).toEqual({ ok: false, error: expect.any(String) });
    expect(check("cadeira", "mesas")).toEqual({ ok: false, error: expect.any(String) });
  });

  it("recusa palavras fora do dicionário", () => {
    expect(check("xxxxx", "mesas")).toMatchObject({ ok: false });
    expect(check("aeiou", "mesas")).toMatchObject({ ok: false });
  });

  it("recusa repetir uma tentativa", () => {
    const first = check("carro", "mesas");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(check("CARRO", "mesas", [{ input: "carro", feedback: first.feedback }])).toMatchObject({ ok: false });
  });

  it("aceita plurais e conjugações comuns", () => {
    for (const word of ["mesas", "gatos", "falar", "comeu", "fomos"]) {
      expect(check(word, "carro").ok, word).toBe(true);
    }
  });
});

describe("desafio do dia", () => {
  it("é determinístico por data", () => {
    for (let i = 0; i < 20; i++) {
      const day = addDays(EPOCH_DATE, i);
      expect(engine.createChallenge(day)).toEqual(engine.createChallenge(day));
    }
  });

  it("o puzzle não carrega a resposta", () => {
    const { puzzle, answer } = engine.createChallenge("2026-10-22");
    expect(JSON.stringify(puzzle)).not.toContain(normalize(answer));
  });

  it("toda resposta tem 5 letras e é uma tentativa válida", () => {
    const validSet = new Set(valid.map(normalize));
    for (const answer of answers) {
      expect(normalize(answer), answer).toMatch(/^[a-z]{5}$/);
      expect(validSet.has(normalize(answer)), answer).toBe(true);
    }
    expect(new Set(answers.map(normalize)).size).toBe(answers.length);
  });
});
