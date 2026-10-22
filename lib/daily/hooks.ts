"use client";

import { useSyncExternalStore } from "react";
import { getDateKey, msUntilNextChallenge } from "./date";

// O relógio só existe no navegador: no prerender os hooks devolvem null e a UI mostra o esqueleto.

function subscribeToMidnight(onChange: () => void) {
  let timer: number;
  const schedule = () => {
    // +1s de folga para não acordar um instante antes da virada.
    timer = window.setTimeout(() => {
      onChange();
      schedule();
    }, msUntilNextChallenge() + 1000);
  };
  schedule();
  // Aba suspensa perde timers: confere de novo quando volta a ficar visível.
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/** Data do desafio de hoje (YYYY-MM-DD), atualizada sozinha à meia-noite de Brasília. */
export function useToday(): string | null {
  return useSyncExternalStore(subscribeToMidnight, () => getDateKey(), () => null);
}

function subscribeToSeconds(onChange: () => void) {
  const timer = window.setInterval(onChange, 1000);
  return () => window.clearInterval(timer);
}

/** Segundos até o próximo desafio, atualizado a cada segundo. */
export function useSecondsToNext(): number | null {
  return useSyncExternalStore(
    subscribeToSeconds,
    () => Math.ceil(msUntilNextChallenge() / 1000),
    () => null,
  );
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
