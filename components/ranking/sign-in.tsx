"use client";

import { useState } from "react";
import { ArrowRight, LogOut, Mail } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { sendLoginLink, signInWithGoogle, signOut, useMe, type Me } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ProfileLink } from "@/components/profile/profile-link";
import { InlineForm } from "./inline-form";

/** O endereço desta tela, para o login voltar para cá. */
const here = () => window.location.pathname + window.location.search;

/**
 * Entrar na Conta, pequeno, no canto da tela: Google, ou o e-mail (o campo abre ao clicar) para o
 * link mágico. Volta para a mesma tela já logado; as partidas deste navegador vão junto (veja
 * `useImportOnLogin`).
 */
export function SignInButtons({ from, className }: { from: string; className?: string }) {
  const [email, setEmail] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  if (sentTo) return <p role="status" className={cn("max-w-64 text-xs text-muted-foreground", className)}>{t.login.sent(sentTo)}</p>;
  return (
    <div className={cn("flex items-start gap-2", className)}>
      {email ? (
        <InlineForm
          compact
          className="w-64"
          autoFocus
          label={t.login.emailLabel}
          submit={t.login.sendLink}
          type="email"
          required
          autoComplete="email"
          placeholder={t.login.emailPlaceholder}
          onSubmit={async (value) => {
            trackEvent("login_started", { method: "email", from });
            try {
              await sendLoginLink(value, here());
              setSentTo(value.trim());
            } catch (error) {
              return (error as Error).message;
            }
          }}
        />
      ) : (
        <button
          type="button"
          aria-label={t.login.emailLabel}
          title={t.login.emailLabel}
          onClick={() => setEmail(true)}
          className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <Mail size={15} />
        </button>
      )}
      <GoogleSignInButton from={from} />
    </div>
  );
}

/** Desliza para fora (o "G") e para dentro (a seta), na mesma largura: a do botão não muda. */
const SWAP = "transition-[width,margin,opacity,transform] duration-[520ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none";

/**
 * O "Entrar com Google" (Microkit · Icon Swap Button): com o mouse em cima, o "G" sai pela esquerda e
 * uma seta entra pela direita.
 */
export function GoogleSignInButton({ from, className }: { from: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent("login_started", { method: "google", from });
        void signInWithGoogle(here());
      }}
      className={cn(
        "group flex h-9 shrink-0 items-center overflow-hidden rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-transform outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.98]",
        className,
      )}
    >
      <span className="relative inline-flex items-center gap-2">
        <GoogleMark
          className={cn(
            SWAP,
            "group-hover:-mr-2 group-hover:w-0 group-hover:-translate-x-[18px] group-hover:opacity-0 group-focus-visible:-mr-2 group-focus-visible:w-0 group-focus-visible:-translate-x-[18px] group-focus-visible:opacity-0",
          )}
        />
        <span className="whitespace-nowrap">{t.login.google}</span>
        <span
          aria-hidden="true"
          className={cn(
            SWAP,
            "-ml-2 grid h-4 w-0 translate-x-[18px] place-items-center overflow-hidden opacity-0 group-hover:ml-0 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
          )}
        >
          <ArrowRight size={15} strokeWidth={2.4} />
        </span>
      </span>
    </button>
  );
}

/**
 * Convite para entrar, com o porquê e os botões. Some para quem já entrou e enquanto a sessão
 * carrega (para não piscar para quem está logado).
 */
export function SignInCard({
  from,
  title = t.login.saveTitle,
  text = t.login.saveText,
  className,
}: {
  from: string;
  title?: string;
  text?: string;
  className?: string;
}) {
  const me = useMe();
  if (me !== null) return null;
  return (
    <div className={cn("rounded-2xl bg-card p-5", className)}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      <SignInButtons from={from} className="mt-4" />
    </div>
  );
}

/** Quem está logado, com o botão de sair. */
export function AccountLine({ me }: { me: Me }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      {t.login.signedInAs}{" "}
      <ProfileLink handle={me.handle} className="font-medium text-foreground hover:underline">
        {me.name}
      </ProfileLink>
      {me.handle && <span>@{me.handle}</span>}
      <button
        type="button"
        onClick={() => void signOut()}
        className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-card hover:text-foreground"
      >
        <LogOut size={13} /> {t.login.signOut}
      </button>
    </p>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("size-4 shrink-0", className)}>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}
