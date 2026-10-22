"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SpotlightNavItem {
  href: string;
  label: string;
  /** Ícone, chip de cor… à esquerda do rótulo. */
  leading?: ReactNode;
  /** Status, contador… alinhado à direita. */
  trailing?: ReactNode;
  /** Título de seção mostrado acima do item. */
  heading?: string;
}

/**
 * Microkit · Spotlight Indicator (https://microkit.co/components/spotlight-indicator), adaptado:
 * links de navegação em vez de botões, com o trilho brilhante deslizando até a rota ativa.
 */
export function SpotlightNav({
  items,
  activeHref,
  label,
}: {
  items: SpotlightNavItem[];
  activeHref: string | null;
  label: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const active = items.findIndex((item) => item.href === activeHref);

  useEffect(() => {
    const nav = navRef.current;
    const bar = barRef.current;
    if (!nav || !bar) return;
    const place = () => {
      const link = linkRefs.current[active];
      if (!link) {
        bar.style.opacity = "0";
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      bar.style.opacity = "1";
      bar.style.top = `${linkRect.top - navRect.top + 8}px`;
      bar.style.height = `${linkRect.height - 16}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active]);

  return (
    <nav ref={navRef} aria-label={label} className="relative flex flex-col gap-px">
      <span
        ref={barRef}
        className="pointer-events-none absolute -left-4 w-[3px] rounded-r-sm bg-[#ff6a1a] opacity-0 shadow-[2px_0_5px_rgba(255,106,26,.7),4px_0_11px_rgba(255,106,26,.35)] transition-[top,height,opacity] duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
      />
      {items.map(({ href, label, leading, trailing, heading }, index) => (
        <Fragment key={href}>
          {heading && (
            <p className="mb-1.5 mt-7 h-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              {heading}
            </p>
          )}
          <Link
            href={href}
            ref={(element) => {
              linkRefs.current[index] = element;
            }}
            aria-current={active === index ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-[15px] font-medium transition-colors duration-200",
              active === index
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            {leading}
            <span className="truncate">{label}</span>
            {trailing && <span className="ml-auto shrink-0">{trailing}</span>}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
