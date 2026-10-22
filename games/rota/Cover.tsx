// Dois países ligados por uma trilha de paradas: a rota por terra.
export function RotaCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <path
        d="M30 120 C26 96 44 78 64 82 C80 70 100 82 96 102 C108 116 94 138 74 136 C58 148 34 140 30 120 Z"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M150 66 C152 46 176 38 192 48 C212 46 222 66 212 82 C218 100 198 114 180 106 C162 112 146 96 150 82 Z"
        fill="currentColor"
      />
      <path
        d="M90 108 C112 108 116 86 132 86 C146 86 144 70 160 74"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      {[
        [112, 100],
        [136, 84],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="7" fill="#fff" stroke="currentColor" strokeWidth="3.5" />
      ))}
      <path d="M64 92 C64 80 80 80 80 92 C80 100 72 104 72 112 C72 104 64 100 64 92 Z" fill="currentColor" />
      <circle cx="72" cy="91" r="3" fill="#fff" />
      <path d="M176 58 C176 46 192 46 192 58 C192 66 184 70 184 78 C184 70 176 66 176 58 Z" fill="#fff" />
      <circle cx="184" cy="57" r="3" fill="currentColor" />
    </svg>
  );
}
