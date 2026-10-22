"use client";

import { flushSync } from "react-dom";

/**
 * Troca de tema com a View Transitions API (a mesma do gradesinteli): um corte diagonal varre a
 * tela e revela o tema novo por cima do antigo. O CSS dos `::view-transition-*` está no globals.css.
 *
 * O callback do startViewTransition precisa deixar o DOM já no tema novo quando retorna, senão o
 * "depois" sai igual ao "antes" e nada anima. Por isso a classe do tema é aplicada direto no <html>
 * (o next-themes só aplica num efeito, tarde demais) e o estado do React vai com `flushSync`.
 */

/** Marca a direção da varredura no <html>, para o CSS escolher o keyframe. */
const ATTR = "data-theme-to";

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function applyClass(next: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(next);
  root.style.colorScheme = next;
}

/** Troca para `next` com a varredura; sem suporte no navegador ou com movimento reduzido, troca direto. */
export function switchTheme(next: "dark" | "light", setTheme: (theme: string) => void) {
  const commit = () => {
    applyClass(next);
    setTheme(next);
  };

  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    commit();
    return;
  }

  const root = document.documentElement;
  root.setAttribute(ATTR, next);
  const transition = document.startViewTransition(() => flushSync(commit));
  // `finished` rejeita quando a transição é pulada (outra começa por cima, aba em segundo plano):
  // o atributo sai nos dois casos.
  void transition.finished.catch(() => {}).finally(() => root.removeAttribute(ATTR));
}
