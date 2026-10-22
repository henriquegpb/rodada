// Um globo com um continente inventado e um alfinete: "que lugar é esse?".
const LAND =
  "M96 70 C108 58 128 60 136 70 C146 66 158 74 156 88 C164 98 158 114 146 116 C142 130 126 138 114 130 C100 134 88 124 92 110 C80 104 82 84 96 70 Z";

export function PaisCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <defs>
        <clipPath id="pais-cover-globe">
          <circle cx="120" cy="100" r="74" />
        </clipPath>
      </defs>
      <g clipPath="url(#pais-cover-globe)" fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".45">
        <ellipse cx="120" cy="100" rx="36" ry="74" />
        <line x1="120" y1="20" x2="120" y2="180" />
        <line x1="40" y1="64" x2="200" y2="64" />
        <line x1="40" y1="100" x2="200" y2="100" />
        <line x1="40" y1="136" x2="200" y2="136" />
      </g>
      <path d={LAND} fill="#fff" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="120" cy="100" r="74" fill="none" stroke="currentColor" strokeWidth="5" />
      <path
        d="M150 40 C150 28 166 28 166 40 C166 50 158 56 158 64 C158 56 150 50 150 40 Z"
        fill="currentColor"
        transform="translate(-36 26)"
      />
      <circle cx="122" cy="66" r="4" fill="#fff" />
    </svg>
  );
}
