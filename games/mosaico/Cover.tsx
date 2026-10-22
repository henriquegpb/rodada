// Uma bandeira em 3×2 peças: duas já viradas, o resto ainda escondido.
const TILE_W = 52;
const TILE_H = 46;
const GAP = 6;
const X0 = 37;
const Y0 = 47;

export function MosaicoCover({ className }: { className?: string }) {
  const tile = (i: number) => ({ x: X0 + (i % 3) * (TILE_W + GAP), y: Y0 + Math.floor(i / 3) * (TILE_H + GAP) });
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <defs>
        <clipPath id="mosaico-cover-a">
          <rect {...tile(1)} width={TILE_W} height={TILE_H} rx="4" />
        </clipPath>
        <clipPath id="mosaico-cover-b">
          <rect {...tile(3)} width={TILE_W} height={TILE_H} rx="4" />
        </clipPath>
      </defs>
      {[0, 2, 4, 5].map((i) => (
        <g key={i}>
          <rect {...tile(i)} width={TILE_W} height={TILE_H} rx="4" fill="currentColor" />
          <text
            x={tile(i).x + TILE_W / 2}
            y={tile(i).y + TILE_H / 2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={20}
            fontWeight={800}
            fill="#fff"
            opacity=".55"
          >
            ?
          </text>
        </g>
      ))}
      {/* Peças viradas: listras e uma estrela, sem ser a bandeira de ninguém. */}
      <g clipPath="url(#mosaico-cover-a)">
        <rect {...tile(1)} width={TILE_W} height={TILE_H} fill="#fff" />
        <path d={`M${tile(1).x} ${tile(1).y + 30} L${tile(1).x + TILE_W} ${tile(1).y + 8} V${tile(1).y + TILE_H} H${tile(1).x} Z`} fill="currentColor" />
      </g>
      <g clipPath="url(#mosaico-cover-b)">
        <rect {...tile(3)} width={TILE_W} height={TILE_H} fill="#fff" />
        <path
          d="M63 106 l4.1 8.3 9.1 1.3 -6.6 6.4 1.6 9.1 -8.2 -4.3 -8.2 4.3 1.6 -9.1 -6.6 -6.4 9.1 -1.3 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
