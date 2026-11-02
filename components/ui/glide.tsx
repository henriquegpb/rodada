"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Um destaque só por lista, que desliza até o item sob o ponteiro (ou o foco do teclado), em vez de
 * cada item acender sozinho. Vai dentro de um container posicionado; `items` diz quais são os itens.
 * Mede pelo getBoundingClientRect relativo ao container, mais a rolagem dele, então funciona em
 * listas que rolam. A primeira vez só aparece no lugar: deslizar de onde parou da última vez
 * pareceria defeito. Raio pelo `--glide-radius` do container.
 */
export function Glide({ items, className }: { items: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = ref.current;
    const host = cursor?.parentElement;
    if (!cursor || !host) return;
    let shown = false;

    const place = (row: HTMLElement) => {
      const hostRect = host.getBoundingClientRect();
      const rect = row.getBoundingClientRect();
      const x = rect.left - hostRect.left + host.scrollLeft - host.clientLeft;
      const y = rect.top - hostRect.top + host.scrollTop - host.clientTop;
      if (!shown) cursor.style.transition = "opacity 180ms ease";
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      cursor.style.width = `${rect.width}px`;
      cursor.style.height = `${rect.height}px`;
      if (!shown) {
        void cursor.offsetWidth;
        cursor.style.transition = "";
        shown = true;
      }
      cursor.dataset.visible = "";
    };

    const hide = () => {
      shown = false;
      delete cursor.dataset.visible;
    };

    const follow = (event: Event) => {
      const row = (event.target as Element | null)?.closest?.(items) as HTMLElement | null;
      if (!row || !host.contains(row) || row.matches(":disabled")) return;
      place(row);
    };

    const onFocusOut = (event: FocusEvent) => {
      if (!host.contains(event.relatedTarget as Node | null) && !host.matches(":hover")) hide();
    };

    host.addEventListener("pointerover", follow);
    host.addEventListener("focusin", follow);
    host.addEventListener("pointerleave", hide);
    host.addEventListener("focusout", onFocusOut);
    return () => {
      host.removeEventListener("pointerover", follow);
      host.removeEventListener("focusin", follow);
      host.removeEventListener("pointerleave", hide);
      host.removeEventListener("focusout", onFocusOut);
    };
  }, [items]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-0 block size-0 rounded-[var(--glide-radius,10px)] bg-foreground/[0.07] opacity-0 transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(.32,.72,0,1)] data-[visible]:opacity-100 motion-reduce:transition-opacity",
        className,
      )}
    />
  );
}
