"use client";

/**
 * Rota exibida antes da atual. O AppShell anota a rota num efeito, que roda depois dos efeitos de
 * layout das páginas: enquanto a página nova monta (ou é reexibida pelo Next), `previousPath()`
 * ainda devolve a página de onde a pessoa veio. Serve para escolher a animação de entrada.
 */
let shown: string | null = null;

export const previousPath = () => shown;

export function notePath(path: string) {
  shown = path;
}
