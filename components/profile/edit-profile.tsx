"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, LogOut } from "lucide-react";
import { FocusInput } from "@/components/microkit/focus-input";
import { checkHandle, saveProfile, signOut, uploadAvatar, type Me } from "@/lib/ranking/client";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Avatar } from "./avatar";

const MAX_NAME = 50;
const MAX_BIO = 160;

/**
 * Os controles da própria Conta, na aba Perfil: foto, nome, @handle e bio (só manda o que mudou) e
 * o botão de sair.
 */
export function AccountSettings({ me, bio }: { me: Me; bio: string }) {
  return (
    <section id="conta" className="scroll-mt-8">
      <h2 className="font-display text-xl">{t.profile.account}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.profile.editHint}</p>
      <div className="mt-5 max-w-md">
        {/* Chave pelo que está salvo: depois de salvar (ou trocar de Conta), o formulário recomeça dali. */}
        <Form key={`${me.id}:${me.name}:${me.handle}:${bio}`} me={me} currentBio={bio} />
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 -ml-3 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <LogOut size={14} /> {t.login.signOut}
      </button>
    </section>
  );
}

function Form({ me, currentBio }: { me: Me; currentBio: string }) {
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle);
  const [bio, setBio] = useState(currentBio);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const ids = { name: useId(), handle: useId(), bio: useId() };

  const cleanHandle = handle.trim().toLowerCase().replace(/^@/, "");
  const changes = {
    ...(name.trim() !== me.name && { name: name.trim() }),
    ...(cleanHandle !== me.handle && { handle: cleanHandle }),
    ...(bio.trim() !== currentBio && { bio: bio.trim() }),
  };
  const dirty = Object.keys(changes).length > 0;

  // Avisa enquanto digita se o handle não vale ou já tem dono.
  useEffect(() => {
    if (cleanHandle === me.handle) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      try {
        const check = await checkHandle(cleanHandle);
        if (!alive) return;
        setHandleError(!check.valid ? t.profile.handleInvalid : !check.available ? t.profile.handleTaken : null);
      } catch {
        // Sem conexão: o servidor confere de novo ao salvar.
      }
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cleanHandle, me.handle]);

  const pickPhoto = async (picked: File | undefined) => {
    if (!picked) return;
    setUploading(true);
    try {
      await uploadAvatar(picked);
      toast.success(t.profile.photoSaved);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!dirty || busy || handleError) return;
        setBusy(true);
        try {
          await saveProfile(changes);
          toast.success(t.profile.saved);
        } catch (error) {
          toast.error((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => file.current?.click()}
          disabled={uploading}
          aria-label={t.profile.changePhoto}
          className="group relative shrink-0 rounded-full disabled:opacity-60"
        >
          <Avatar name={name || me.name} seed={me.id} image={me.image} className="size-16 text-lg" />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={20} />
          </span>
        </button>
        <div className="text-sm">
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={uploading}
            className="font-semibold text-primary disabled:opacity-60"
          >
            {uploading ? t.profile.uploading : t.profile.changePhoto}
          </button>
          <p className="text-xs text-muted-foreground">{t.profile.photoHint}</p>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
      </div>

      <Field id={ids.name} label={t.profile.name}>
        <FocusInput id={ids.name} value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <Field id={ids.handle} label={t.profile.handle} error={handleError}>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <FocusInput
            id={ids.handle}
            value={handle}
            maxLength={21}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={Boolean(handleError)}
            onChange={(e) => {
              setHandle(e.target.value);
              setHandleError(null);
            }}
            className="pl-8"
          />
        </div>
      </Field>

      <Field id={ids.bio} label={t.profile.bio} hint={`${bio.length}/${MAX_BIO}`}>
        <textarea
          id={ids.bio}
          value={bio}
          maxLength={MAX_BIO}
          rows={3}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t.profile.bioPlaceholder}
          className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#f97316] focus:shadow-[0_0_0_4px_#f9731625]"
        />
      </Field>

      <button
        type="submit"
        disabled={!dirty || busy || Boolean(handleError)}
        className="h-11 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? t.profile.saving : t.profile.save}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs tabular-nums text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className={cn("text-xs text-destructive")}>{error}</p>}
    </div>
  );
}
