"use client";

import { useSyncExternalStore } from "react";
import { setSoundMuted } from "@/components/sounds/react-bits-sound";

/** Preferência de som mudo, guardada no navegador e aplicada ao player da React Bits. */
const KEY = "rodada:som-mudo";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") setSoundMuted(read());

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // Modo privado: vale só nesta visita.
  }
  setSoundMuted(muted);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    setSoundMuted(read());
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMuted(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
