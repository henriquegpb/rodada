import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Três peças, uma por jogo da rodada, em escadinha. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("size-7", className)} aria-hidden="true">
      <rect x="1" y="15" width="8" height="12" rx="1.5" fill="#ff6a1a" />
      <rect x="10" y="8" width="8" height="19" rx="1.5" fill="#2f7cf6" />
      <rect x="19" y="1" width="8" height="26" rx="1.5" fill="#19b46e" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label={t.brand.name}>
      <LogoMark />
      <span className="font-display text-[22px] leading-none tracking-tight">{t.brand.name.toLowerCase()}</span>
    </Link>
  );
}
