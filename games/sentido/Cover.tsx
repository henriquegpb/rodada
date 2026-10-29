// A lista de chutes no meio da partida: a barra cresce quanto mais perto da palavra secreta.
const ROWS = [
  { y: 34, fill: 1, word: 44 },
  { y: 70, fill: 0.72, word: 58 },
  { y: 106, fill: 0.45, word: 36 },
  { y: 142, fill: 0.22, word: 50 },
];
const X = 30;
const W = 180;
const H = 28;

export function SentidoCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {ROWS.map(({ y, fill, word }, i) => (
        <g key={y}>
          <rect x={X} y={y} width={W} height={H} rx={6} fill="none" stroke="currentColor" strokeWidth={3} />
          <rect x={X} y={y} width={W * fill} height={H} rx={6} fill={i === 0 ? "#fff" : "currentColor"} opacity={i === 0 ? 1 : 0.45} />
          <rect x={X + 12} y={y + H / 2 - 3} width={word} height={6} rx={3} fill="currentColor" />
          {/* O número da posição, em pontinhos: 1, 2, 3, 4 da mais perto à mais longe. */}
          {Array.from({ length: i + 1 }, (_, d) => (
            <circle key={d} cx={X + W - 14 - d * 9} cy={y + H / 2} r={3} fill="currentColor" />
          ))}
        </g>
      ))}
    </svg>
  );
}
