import { useId, type CSSProperties } from "react";
import { SCENE, aspectOf } from "./scene";
import type { Shape } from "./types";

/**
 * Uma silhueta em pé no chão da cena, com `height` pixels de altura, pintada com `fill`. As imagens
 * viram máscara (só o contorno conta), então a mesma figura serve de referência, palpite e fantasma.
 */
export function Figure({ shape, x, height, fill, className, style }: { shape: Shape; x: number; height: number; fill?: string; className?: string; style?: CSSProperties }) {
  const id = useId();
  const width = height * aspectOf(shape);
  const y = SCENE.GROUND - height;
  if (shape.kind === "path") {
    const [bx, by, , bh] = shape.box;
    const k = height / bh;
    return (
      <path
        d={shape.d}
        fillRule="evenodd"
        transform={`translate(${x} ${y}) scale(${k}) translate(${-bx} ${-by})`}
        fill={fill}
        className={className}
        style={style}
      />
    );
  }
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height} style={{ maskType: "alpha" }}>
        <image href={shape.src} x={x} y={y} width={width} height={height} preserveAspectRatio="none" />
      </mask>
      <rect x={x} y={y} width={width} height={height} fill={fill} mask={`url(#${id})`} className={className} style={style} />
    </>
  );
}
