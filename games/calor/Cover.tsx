// Um globo com manchas de calor e um termômetro ao lado: quente ou frio?
export function CalorCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <defs>
        <clipPath id="calor-cover-globe">
          <circle cx="104" cy="100" r="70" />
        </clipPath>
      </defs>
      <circle cx="104" cy="100" r="70" fill="#fff" />
      <g clipPath="url(#calor-cover-globe)">
        <g fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".3">
          <ellipse cx="104" cy="100" rx="34" ry="70" />
          <line x1="104" y1="30" x2="104" y2="170" />
          <line x1="34" y1="70" x2="174" y2="70" />
          <line x1="34" y1="130" x2="174" y2="130" />
        </g>
        <path d="M70 62 C82 52 102 56 106 70 C112 84 96 96 82 92 C68 90 60 74 70 62 Z" fill="currentColor" />
        <path d="M118 104 C130 98 146 106 144 120 C142 134 124 140 114 130 C106 122 108 110 118 104 Z" fill="currentColor" opacity=".55" />
        <path d="M60 118 C68 112 82 116 80 128 C78 138 66 140 60 134 C54 128 54 122 60 118 Z" fill="currentColor" opacity=".25" />
      </g>
      <circle cx="104" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="5" />
      <rect x="192" y="44" width="16" height="92" rx="8" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <circle cx="200" cy="148" r="16" fill="currentColor" />
      <rect x="196" y="72" width="8" height="70" rx="4" fill="currentColor" />
    </svg>
  );
}
