"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HoldToDeleteButton } from "@/components/microkit/hold-to-delete-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { deleteAccount, refreshAll } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";

/** Quanto o check fica na tela antes do popup fechar e a página sair do Perfil excluído. */
const DONE_MS = 900;

/**
 * Só para Dev, no Perfil de outra pessoa: "Excluir conta" abre a confirmação, e segurar o botão
 * exclui a Conta com tudo dela; depois vai para o ranking. Se der errado, o erro aparece num aviso
 * e o botão volta ao começo.
 */
export function DeleteAccountButton({ account }: { account: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
      router.replace("/ranking");
      refreshAll();
    }, DONE_MS);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 text-sm font-semibold text-destructive transition-[background-color,transform] hover:bg-destructive/20 active:scale-[0.98]"
      >
        <Trash2 size={14} /> {t.dev.deleteAccount}
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
