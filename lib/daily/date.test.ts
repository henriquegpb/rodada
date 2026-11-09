import { describe, expect, it } from "vitest";
import { addDays, challengeNumber, daysBetween, EPOCH_DATE, getDateKey, isDateKey, msUntilNextChallenge, zonedMidnight } from "./date";

describe("getDateKey", () => {
  it("vira o dia à meia-noite de Brasília, não à meia-noite UTC", () => {
    // Brasília é UTC−3: 02:59 UTC ainda é o dia anterior, 03:00 UTC já é o novo dia.
    expect(getDateKey(new Date("2026-10-22T02:59:59Z"))).toBe("2026-10-21");
    expect(getDateKey(new Date("2026-10-22T03:00:00Z"))).toBe("2026-10-22");
  });

  it("não depende do fuso de quem está jogando", () => {
    const instant = new Date("2026-12-31T23:30:00-08:00"); // Los Angeles
    expect(getDateKey(instant)).toBe("2027-01-01");
  });
});

describe("contagem de dias", () => {
  it("o primeiro dia é o desafio #1", () => {
    expect(challengeNumber(EPOCH_DATE)).toBe(1);
    expect(challengeNumber(addDays(EPOCH_DATE, 21))).toBe(22);
  });

  it("addDays atravessa meses e anos", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(daysBetween("2026-10-01", "2026-10-22")).toBe(21);
  });
});

describe("próximo desafio", () => {
  it("meia-noite em Brasília é 03:00 UTC", () => {
    expect(new Date(zonedMidnight("2026-10-22")).toISOString()).toBe("2026-10-22T03:00:00.000Z");
  });

  it("conta o tempo até a próxima meia-noite de Brasília", () => {
    expect(msUntilNextChallenge(new Date("2026-10-22T02:59:00Z"))).toBe(60_000);
    expect(msUntilNextChallenge(new Date("2026-10-22T03:00:00Z"))).toBe(86_400_000);
  });
});

describe("isDateKey", () => {
  it("aceita datas que existem, inclusive 29 de fevereiro em ano bissexto", () => {
    for (const d of ["2026-10-22", "2026-12-31", "2028-02-29"]) expect(isDateKey(d)).toBe(true);
  });

  it("recusa datas com o formato certo que não existem no calendário", () => {
    for (const d of ["2026-10-40", "2026-11-31", "2026-02-29", "2026-13-01", "2026-00-10"]) expect(isDateKey(d)).toBe(false);
  });

  it("recusa o que não é YYYY-MM-DD", () => {
    for (const d of ["2026-1-1", "22/10/2026", "", null, 20261022]) expect(isDateKey(d)).toBe(false);
  });
});
