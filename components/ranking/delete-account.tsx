"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { HoldToDeleteButton } from "@/components/microkit/hold-to-delete-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { deleteAccount, refreshAll } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";

/** Quanto o check fica na tela antes do popup fechar e a linha sumir do ranking. */
const DONE_MS = 900;

/**
 * Só para Dev: o X ao lado do nome no ranking abre a confirmação, e segurar o botão exclui a Conta
 * com tudo dela. Se der errado, o erro aparece num aviso e o botão volta ao começo.
 */
export function DeleteAccountButton({ account }: { account: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);

  async function confirm() {
    try {
      await deleteAccount(account.id);
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
    window.setTimeout(() => {
      setOpen(false);
      toast.success(t.dev.deleted(account.name));
      refreshAll();
    }, DONE_MS);
  }

  return (
    <>
      <button
        type="button"
        aria-label={t.dev.deleteAccount(account.name)}
        onClick={() => setOpen(true)}
        className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="justify-items-center gap-3 p-6 text-center sm:max-w-sm">
          <DialogTitle className="font-display text-xl leading-tight">{t.dev.deleteTitle(account.name)}</DialogTitle>
          <DialogDescription>{t.dev.deleteHint}</DialogDescription>
          <div className="mt-3">
            <HoldToDeleteButton
              onConfirm={confirm}
              label={t.dev.deleteHold}
              pendingLabel={t.dev.deletePending}
              doneLabel={t.dev.deleteDone}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
