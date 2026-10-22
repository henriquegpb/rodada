// Uma lista sendo riscada contra o relógio.
const ROWS = [
  { y: 58, width: 74, done: true },
  { y: 88, width: 56, done: true },
  { y: 118, width: 82, done: true },
  { y: 148, width: 64, done: false },
];

export function MundoCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {ROWS.map((row) => (
        <g key={row.y} opacity={row.done ? 1 : 0.4}>
          <rect
            x="22"
            y={row.y - 10}
            width="20"
            height="20"
            rx="4"
            fill={row.done ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="3"
          />
          {row.done && (
            <path
              d={`M27 ${row.y} l4 4 l7 -8`}
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <rect x="52" y={row.y - 5} width={row.width} height="10" rx="5" fill="currentColor" />
        </g>
      ))}
      <rect x="166" y="34" width="16" height="12" rx="3" fill="currentColor" />
      <circle cx="174" cy="96" r="48" fill="#fff" stroke="currentColor" strokeWidth="6" />
      <path d="M174 96 L174 64" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M174 96 L196 108" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="174" cy="96" r="6" fill="currentColor" />
      <path d="M174 48 A48 48 0 0 1 222 96 L174 96 Z" fill="currentColor" opacity=".18" />
    </svg>
  );
}
