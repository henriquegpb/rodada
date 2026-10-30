// A colmeia de 7 letras: a do meio em branco, uma de fora já tocada.
const R = 25;
const CX = 120;
const CY = 100;
/** Centros dos hexágonos: o do meio e os 6 em volta, como no tabuleiro. */
const CELLS: [x: number, y: number][] = [
  [0, 0],
  [-0.52, -0.9],
  [0.52, -0.9],
  [-1.04, 0],
  [1.04, 0],
  [-0.52, 0.9],
  [0.52, 0.9],
];
const W = R * Math.sqrt(3);

function hexagon(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

export function ColmeiaCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {CELLS.map(([x, y], i) => {
        const cx = CX + x * W;
        const cy = CY + y * W;
        return (
          <g key={i}>
            <polygon
              points={hexagon(cx, cy)}
              fill={i === 0 ? "#fff" : i === 2 ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={4}
              strokeLinejoin="round"
            />
            {/* A "letra" de cada casa, um traço só, para não parecer uma palavra de verdade. */}
            <rect
              x={cx - 6}
              y={cy - 2.5}
              width={12}
              height={5}
              rx={2.5}
              fill={i === 2 ? "#fff" : "currentColor"}
              opacity={i === 0 || i === 2 ? 1 : 0.5}
            />
          </g>
        );
      })}
    </svg>
  );
}
