// Um tabuleiro 4×4 no meio da partida: o caminho branco já passou pelo 1, 2 e 3, contornou uma
// parede e segue rumo ao 4.
const CELL = 34;
const GAP = 5;
const X0 = 120 - (4 * CELL + 3 * GAP) / 2;
const Y0 = 100 - (4 * CELL + 3 * GAP) / 2;
/** Casas por onde o caminho já passou, em ordem (linha * 4 + coluna). */
const PATH = [0, 1, 5, 4, 8, 12, 13, 9, 10, 14, 15, 11, 7];
/** Casa de cada número: 1, 2, 3 e 4. */
const NUMBERS = [0, 12, 15, 3];

const cx = (i: number) => X0 + (i % 4) * (CELL + GAP) + CELL / 2;
const cy = (i: number) => Y0 + Math.floor(i / 4) * (CELL + GAP) + CELL / 2;

export function TrilhaCover({ className }: { className?: string }) {
  const head = PATH[PATH.length - 1];
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={cx(i) - CELL / 2}
          y={cy(i) - CELL / 2}
          width={CELL}
          height={CELL}
          rx={5}
          fill={PATH.includes(i) ? "#fff" : "currentColor"}
          opacity={PATH.includes(i) ? 0.4 : 0.18}
        />
      ))}
      {/* Parede entre a 2ª e a 3ª linha, na 3ª coluna. */}
      <line x1={cx(10) - CELL / 2 - 1} y1={cy(10) - CELL / 2 - GAP / 2} x2={cx(10) + CELL / 2 + 1} y2={cy(10) - CELL / 2 - GAP / 2} stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
      <polyline
        points={PATH.map((i) => `${cx(i)},${cy(i)}`).join(" ")}
        fill="none"
        stroke="#fff"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={cx(head)} cy={cy(head)} r={9} fill="#fff" stroke="currentColor" strokeWidth={3.5} />
      {NUMBERS.map((cell, k) => (
        <g key={cell}>
          <circle cx={cx(cell)} cy={cy(cell)} r={11.5} fill="currentColor" />
          <text x={cx(cell)} y={cy(cell) + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={800} fill="#fff">
            {k + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
