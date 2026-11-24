// O submarino descendo para o fundo, com bolhas subindo e a luz de um peixe-diabo lá embaixo.
export function IncomumCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {/* Ondas da superfície */}
      <path
        d="M0 26 Q20 16 40 26 T80 26 T120 26 T160 26 T200 26 T240 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Bolhas */}
      {[
        [58, 56, 6],
        [70, 40, 4],
        [50, 76, 3.5],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.7" />
      ))}
      {/* Submarino inclinado, descendo */}
      <g transform="rotate(24 110 100)">
        <rect x="62" y="80" width="104" height="40" rx="20" fill="currentColor" />
        <rect x="96" y="64" width="34" height="20" rx="7" fill="currentColor" />
        <path d="M118 64 V54 H128" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        {[92, 116, 140].map((x) => (
          <circle key={x} cx={x} cy="100" r="7" fill="#fff" />
        ))}
        <rect x="50" y="92" width="14" height="16" rx="4" fill="currentColor" />
      </g>
      {/* A luz lá no fundo */}
      <circle cx="196" cy="172" r="16" fill="#fff" opacity="0.25" />
      <circle cx="196" cy="172" r="6" fill="#fff" />
    </svg>
  );
}
