"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Microkit · Sliding Underline Tabs (https://microkit.co/components/sliding-underline-tabs), adaptado:
 * abas e conteúdo vêm por props, com qualquer número de abas.
 */
export function SlidingUnderlineTabs({
  tabs,
  label,
}: {
  tabs: { label: string; content: ReactNode }[];
  label: string;
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const width = `calc(${100 / tabs.length}% - 8px)`;

  return (
    <section>
      <style>
        {
          "@keyframes underline-tabs-enter { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }"
        }
      </style>
      <div
        className="relative grid border-b border-border"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        role="tablist"
        aria-label={label}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`${id}-panel`}
            className={`relative z-10 cursor-pointer border-0 bg-transparent px-1 py-3 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#f97316] ${active === index ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActive(index)}
          >
            {tab.label}
          </button>
        ))}
        <span
          className="pointer-events-none absolute bottom-[-2px] left-1 h-[3px] rounded-full bg-[#f97316] transition-transform duration-[750ms] ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ width, transform: `translateX(calc(${active * 100}% + ${active * 8}px))` }}
          aria-hidden="true"
        />
      </div>
      <div
        key={active}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        className="pt-6 [animation:underline-tabs-enter_.65s_cubic-bezier(.22,1,.36,1)]"
      >
        {tabs[active]?.content}
      </div>
    </section>
  );
}
