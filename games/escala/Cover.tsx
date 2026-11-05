// Uma pessoa pequena ao lado de outra bem maior, com a alça de redimensionar no canto.
const PERSON = "M10 0 A7 7 0 1 1 9.99 0 Z M3 16 H17 Q21 16 21.5 20 L23 46 H19.5 L18.5 30 L18 70 H12 L10.5 46 H9.5 L8 70 H2 L1.5 30 L0.5 46 H-3 L-1.5 20 Q-1 16 3 16 Z";

export function EscalaCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <line x1="20" y1="168" x2="220" y2="168" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="44" x2="212" y2="44" stroke="currentColor" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" opacity=".5" />
      <path d={PERSON} transform="translate(52 121) scale(0.67)" fill="#fff" stroke="currentColor" strokeWidth="5" />
      <path d={PERSON} transform="translate(126 44) scale(1.77)" fill="currentColor" />
      <circle cx="176" cy="44" r="12" fill="#fff" stroke="currentColor" strokeWidth="5" />
      <path d="M171 49 L181 39" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
