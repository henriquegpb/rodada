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

const STORAGE_KEY = "rodada:plays:v1";
const EMPTY: PlayMap = Object.freeze({});

export const playKey = (slug: string, dateKey: string) => `${slug}:${dateKey}`;

let cache: PlayMap | null = null;
const listeners = new Set<() => void>();

function read(): PlayMap {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as PlayMap;
  } catch {
    cache = {};
  }
  return cache;
}

export function getPlays(): PlayMap {
  return typeof window === "undefined" ? EMPTY : read();
}

export function getPlay(slug: string, dateKey: string): StoredPlay | undefined {
  return getPlays()[playKey(slug, dateKey)];
}

export function savePlay(play: StoredPlay) {
  cache = { ...read(), [playKey(play.slug, play.dateKey)]: play };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Modo privado ou cota cheia: a partida segue só em memória.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Todas as partidas, reativo (inclusive entre abas). */
export function usePlays(): PlayMap {
  return useSyncExternalStore(subscribe, getPlays, () => EMPTY);
}
