// Um tabuleiro no meio da partida: um chute, um quase, a palavra certa e uma linha vazia.
const ROWS: { letters: string; marks: string }[] = [
  { letters: "PRATO", marks: ".#o.." },
  { letters: "TERRA", marks: "#o..o" },
  { letters: "LETRA", marks: "#####" },
  { letters: "     ", marks: "     " },
];

const SIZE = 36;
const GAP = 6;

export function PalavraCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {ROWS.map((row, r) =>
        [...row.letters].map((letter, c) => {
          const x = 18 + c * (SIZE + GAP);
          const y = 17 + r * (SIZE + GAP);
          const mark = row.marks[c];
          const filled = mark === "#";
          const present = mark === "o";
          return (
            <g key={`${r}-${c}`} opacity={letter === " " ? 0.35 : 1}>
              <rect
                x={x}
                y={y}
                width={SIZE}
                height={SIZE}
                rx={5}
                fill={filled ? "currentColor" : present ? "#fff" : "none"}
                stroke="currentColor"
                strokeWidth={filled || present ? 0 : 3}
              />
              <text
                x={x + SIZE / 2}
                y={y + SIZE / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={19}
                fontWeight={800}
                fill={filled ? "#fff" : "currentColor"}
              >
                {letter}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
