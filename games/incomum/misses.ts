/**
 * Avisa o servidor de uma resposta que o jogo recusou ("não está na lista"), para a revisão das
 * listas (server/incomum-misses.ts). Em segundo plano: falhar aqui nunca atrapalha a partida.
 */
export function reportMiss(dateKey: string, index: number, input: string): void {
  try {
    void fetch("/api/incomum/misses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dateKey, index, input }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Sem rede ou sem fetch: fica sem avisar.
  }
}
