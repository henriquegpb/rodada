// Um mostrador com um ângulo aberto, um chute tracejado e a marca de grau.
export function GrauCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <circle cx="120" cy="100" r="74" fill="#fff" stroke="currentColor" strokeWidth="5" />
      <path d="M120 100 L148.98 107.76 A30 30 0 0 0 105 74.02 Z" fill="currentColor" opacity=".25" />
      <path d="M148.98 107.76 A30 30 0 0 0 105 74.02" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="120" y1="100" x2="108.9" y2="37" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" opacity=".5" />
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <line x1="120" y1="100" x2="181.8" y2="116.6" />
        <line x1="120" y1="100" x2="88" y2="44.6" />
      </g>
      <circle cx="88" cy="44.6" r="9" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <circle cx="120" cy="100" r="7" fill="currentColor" />
      <circle cx="206" cy="40" r="11" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}
