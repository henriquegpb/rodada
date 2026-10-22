// A grade no meio da partida: um grupo já ligado no topo, duas palavras escolhidas e o resto esperando.
const W = 46;
const H = 34;
const GAP = 6;
const X0 = 19;
const Y0 = 23;

/** Linha, coluna das palavras escolhidas (nas três linhas de baixo). */
const SELECTED = new Set(["0-1", "2-2"]);
/** Largura do "texto" de cada casa, para a grade não parecer carimbada. */
const WORD = [30, 24, 34, 22, 26, 32, 20, 28, 34, 24, 30, 26];

export function EloCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <rect x={X0} y={Y0} width={4 * W + 3 * GAP} height={H} rx={6} fill="currentColor" />
      <rect x={X0 + 56} y={Y0 + 10} width={90} height={6} rx={3} fill="#fff" />
      <rect x={X0 + 70} y={Y0 + 21} width={62} height={4} rx={2} fill="#fff" opacity=".6" />
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => {
          const x = X0 + c * (W + GAP);
          const y = Y0 + (r + 1) * (H + GAP);
          const selected = SELECTED.has(`${r}-${c}`);
          const width = WORD[r * 4 + c];
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x + 1.5}
                y={y + 1.5}
                width={W - 3}
                height={H - 3}
                rx={5}
                fill={selected ? "#fff" : "none"}
                stroke={selected ? "none" : "currentColor"}
                strokeWidth={3}
              />
              <rect
                x={x + (W - width) / 2}
                y={y + H / 2 - 2.5}
                width={width}
                height={5}
                rx={2.5}
                fill="currentColor"
                opacity={selected ? 1 : 0.45}
              />
            </g>
          );
        }),
      )}
    </svg>
  );
}
