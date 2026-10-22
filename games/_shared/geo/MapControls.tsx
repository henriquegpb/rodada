"use client";

import type { ReactNode } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";

/** Botões no canto de um mapa com `usePanZoom`: aproximar, afastar e voltar ao enquadramento inicial. */
export function MapControls({ zoomIn, zoomOut, reset }: { zoomIn(): void; zoomOut(): void; reset(): void }) {
  return (
    <div className="absolute right-3 top-3 flex flex-col gap-1.5">
      <MapButton label="Aproximar" onClick={zoomIn}>
        <Plus size={16} />
      </MapButton>
      <MapButton label="Afastar" onClick={zoomOut}>
        <Minus size={16} />
      </MapButton>
      <MapButton label="Recentralizar" onClick={reset}>
        <LocateFixed size={16} />
      </MapButton>
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick(): void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Clicar não tira o foco do campo de digitação.
      onPointerDown={(e) => e.preventDefault()}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-md border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}
