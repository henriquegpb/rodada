// Um país inventado com a estrela de capital dos mapas e uma etiqueta com "?": "que cidade é essa?".
const LAND =
  "M70 62 C88 44 118 48 132 58 C150 48 176 58 178 80 C192 92 188 116 170 124 C168 142 146 152 128 144 C110 154 84 148 80 130 C60 124 54 98 66 86 C60 78 62 68 70 62 Z";

export function CapitalCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <path d={LAND} fill="#fff" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      {/* Estrela dentro de um anel: o símbolo de capital nos mapas. */}
      <circle cx="122" cy="100" r="22" fill="none" stroke="currentColor" strokeWidth="5" />
      <path
        d="M122 85 L126.4 94.5 L136.8 95.6 L129 102.6 L131.2 112.9 L122 107.6 L112.8 112.9 L115 102.6 L107.2 95.6 L117.6 94.5 Z"
        fill="currentColor"
      />
      {/* Etiqueta do nome da cidade, ainda em branco. */}
      <line x1="140" y1="86" x2="160" y2="66" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="152" y="38" width="56" height="30" rx="6" fill="currentColor" />
      <text x="180" y="61" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" fontFamily="var(--font-sans), sans-serif">
        ?
      </text>
    </svg>
  );
}
