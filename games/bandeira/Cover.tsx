// Uma bandeira ao vento, sem país: a faixa do meio guarda a pergunta.
const FLAG = "M78 34 C108 20 142 50 184 34 L184 116 C142 132 108 102 78 116 Z";

export function BandeiraCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <defs>
        <clipPath id="bandeira-cover-flag">
          <path d={FLAG} />
        </clipPath>
      </defs>
      <rect x="70" y="26" width="7" height="160" rx="3.5" fill="currentColor" />
      <circle cx="73.5" cy="24" r="7" fill="currentColor" />
      <ellipse cx="73.5" cy="188" rx="26" ry="6" fill="currentColor" opacity=".25" />
      <path d={FLAG} fill="#fff" />
      <g clipPath="url(#bandeira-cover-flag)">
        <rect x="70" y="58" width="120" height="32" fill="currentColor" />
      </g>
      <text x="132" y="76" textAnchor="middle" dominantBaseline="central" fontSize={28} fontWeight={800} fill="#fff">
        ?
      </text>
      <path d={FLAG} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
