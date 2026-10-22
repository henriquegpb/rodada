"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface ExpandingTabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Microkit · Expanding Icon Tabs (https://microkit.co/components/expanding-icon-tabs), adaptado
 * como navegação inferior do celular: a aba da rota atual se alarga e revela o nome.
 */
export function ExpandingIconTabs({
  items,
  activeHref,
  label,
}: {
  items: ExpandingTabItem[];
  activeHref: string | null;
  label: string;
}) {
  return (
    <nav
      className="flex items-center justify-between gap-0.5 rounded-2xl border border-border bg-card/95 p-1.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_24px_rgba(0,0,0,.35)] backdrop-blur"
      aria-label={label}
    >
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 items-center rounded-xl text-sm font-medium [transition:gap_.5s_cubic-bezier(.32,.72,0,1),padding_.5s_cubic-bezier(.32,.72,0,1),background-color_.3s_ease,color_.3s_ease] focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-offset-[-1.5px] focus-visible:outline-[#f97316] ${
              active
                ? "gap-2 bg-secondary px-3 text-foreground"
                : "gap-0 bg-transparent px-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <span
              className={`grid flex-none place-items-center [transition:color_.3s_ease] ${active ? "text-[#f97316]" : ""}`}
            >
              <item.icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span
              className={`grid overflow-hidden [transition:grid-template-columns_.5s_cubic-bezier(.32,.72,0,1),opacity_.3s_ease] ${
                active ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
              }`}
              aria-hidden="true"
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap">{item.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
