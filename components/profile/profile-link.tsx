import Link from "next/link";
import type { ReactNode } from "react";

export const profileHref = (handle: string) => `/perfil/${encodeURIComponent(handle)}`;

/** Leva ao Perfil público de quem tem o handle; sem handle, só o conteúdo. */
export function ProfileLink({ handle, className, children }: { handle: string; className?: string; children: ReactNode }) {
  if (!handle) return <span className={className}>{children}</span>;
  return (
    <Link href={profileHref(handle)} className={className}>
      {children}
    </Link>
  );
}
