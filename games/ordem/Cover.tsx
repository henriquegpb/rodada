// Uma lista de cinco barras, da maior para a menor, com uma bandeirinha em cada e a seta de ordem.
const BARS = [132, 108, 84, 62, 40];

export function OrdemCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {BARS.map((width, i) => {
        const y = 34 + i * 28;
        return (
          <g key={i}>
            <rect x="42" y={y} width="26" height="18" rx="3" fill="#fff" stroke="currentColor" strokeWidth="4" />
            <rect x="78" y={y + 1} width={width} height="16" rx="8" fill={i === 1 ? "#fff" : "currentColor"} opacity={i === 1 ? 1 : 0.85 - i * 0.12} />
          </g>
        );
      })}
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="224" y1="40" x2="224" y2="150" />
        <polyline points="212,138 224,152 236,138" />
      </g>
    </svg>
  );
}
