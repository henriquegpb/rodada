// Um tabuleiro 4×4 com as regiões em tons da tinta, uma rainha posta e dois X marcados.
const CELL = 34;
const GAP = 5;
const X0 = 120 - (4 * CELL + 3 * GAP) / 2;
const Y0 = 100 - (4 * CELL + 3 * GAP) / 2;
/** Região (0–3) de cada casa: a opacidade da tinta separa as cores. */
const REGIONS = [0, 0, 1, 1, 0, 2, 2, 1, 3, 2, 2, 1, 3, 3, 2, 2];
const OPACITY = [0.18, 0.45, 0.7, 0.3];
const QUEEN = 5;
const MARKS = [4, 6];

export function RainhasCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {REGIONS.map((g, i) => {
        const x = X0 + (i % 4) * (CELL + GAP);
        const y = Y0 + Math.floor(i / 4) * (CELL + GAP);
        return (
          <g key={i}>
            <rect x={x} y={y} width={CELL} height={CELL} rx={5} fill={i === QUEEN ? "#fff" : "currentColor"} opacity={i === QUEEN ? 1 : OPACITY[g]} />
            {MARKS.includes(i) && (
              <path
                d={`M${x + 11} ${y + 11} L${x + CELL - 11} ${y + CELL - 11} M${x + CELL - 11} ${y + 11} L${x + 11} ${y + CELL - 11}`}
                stroke="currentColor"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            )}
            {i === QUEEN && (
              // Coroa: três pontas sobre uma base.
              <path
                d={`M${x + 8} ${y + 25} L${x + 6} ${y + 11} L${x + 12.5} ${y + 17} L${x + 17} ${y + 8} L${x + 21.5} ${y + 17} L${x + 28} ${y + 11} L${x + 26} ${y + 25} Z`}
                fill="currentColor"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
