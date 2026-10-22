"use client";

import { useSyncExternalStore } from "react";
import type { Guess, PlayStatus } from "@/games/types";

/**
 * Partidas guardadas no navegador. É o único armazenamento enquanto não há backend;
 * depois continua servindo quem joga deslogado e é a fonte da importação ao logar.
 */
export interface StoredPlay {
  slug: string;
  dateKey: string;
  number: number;
  guesses: Guess[];
  status: PlayStatus;
  answerLabel?: string;
  startedAt: string;
  finishedAt?: string;
}

export type PlayMap = Readonly<Record<string, StoredPlay>>;

const EMPTY: PlayMap = Object.freeze({});

export const playKey = (slug: string, dateKey: string) => `${slug}:${dateKey}`;

export interface PlayStore {
  getPlays(): PlayMap;
  getPlay(slug: string, dateKey: string): StoredPlay | undefined;
  savePlay(play: StoredPlay): void;
  usePlays(): PlayMap;
}

/**
 * Uma coleção de partidas no localStorage, reativa (inclusive entre abas).
 * `latestOnly` guarda só a partida mais recente de cada jogo.
 */
function createPlayStore(storageKey: string, { latestOnly = false } = {}): PlayStore {
  let cache: PlayMap | null = null;
  const listeners = new Set<() => void>();

  function read(): PlayMap {
    if (cache) return cache;
    try {
      cache = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as PlayMap;
    } catch {
      cache = {};
    }
    return cache;
  }

  const getPlays = () => (typeof window === "undefined" ? EMPTY : read());

  function savePlay(play: StoredPlay) {
    const kept = latestOnly ? Object.fromEntries(Object.entries(read()).filter(([, p]) => p.slug !== play.slug)) : read();
    cache = { ...kept, [playKey(play.slug, play.dateKey)]: play };
    try {
      localStorage.setItem(storageKey, JSON.stringify(cache));
    } catch {
      // Modo privado ou cota cheia: a partida segue só em memória.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    getPlays,
    getPlay: (slug, dateKey) => getPlays()[playKey(slug, dateKey)],
    savePlay,
    usePlays: () => useSyncExternalStore(subscribe, getPlays, () => EMPTY),
  };
}

/** Desafios do dia: a fonte de sequências, estatísticas e histórico. */
export const dailyStore = createPlayStore("rodada:plays:v1");

/** Treino ("Jogar outra"): uma partida por jogo, que nunca conta para nada. */
export const practiceStore = createPlayStore("rodada:practice:v1", { latestOnly: true });

export const { getPlays, getPlay, savePlay, usePlays } = dailyStore;
