"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HoldToDeleteButton } from "@/components/microkit/hold-to-delete-button";
import { deleteAccount, refreshAll } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";

/** Quanto o check fica na tela antes de a página sair do Perfil excluído. */
const DONE_MS = 900;

/**
 * Só para Admin, no Perfil de outra pessoa: segurar o botão até a barra encher exclui a Conta com tudo
 * dela, sem outra confirmação, e depois vai para o ranking. Se der errado, o erro aparece num aviso
 * e o botão volta ao começo.
 */
export function DeleteAccountButton({ account }: { account: { id: string; name: string } }) {
  const router = useRouter();

  async function confirm() {
    try {
      await deleteAccount(account.id);
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
    window.setTimeout(() => {
      toast.success(t.dev.deleted(account.name));
      router.replace("/ranking");
      refreshAll();
    }, DONE_MS);
  }

  return (
    <HoldToDeleteButton
      onConfirm={confirm}
      label={t.dev.deleteAccount}
      pendingLabel={t.dev.deletePending}
      doneLabel={t.dev.deleteDone}
      iconSize={14}
      // O formato do "Editar perfil". O light-dark() do Microkit não vale aqui (o Tailwind o troca
      // por variáveis que o tema não define), então fundo e texto também vêm do tema.
      className="h-9 w-full rounded-lg bg-secondary px-3 text-sm font-semibold tracking-normal text-foreground hover:data-[state=idle]:bg-secondary hover:data-[state=idle]:brightness-110"
    />
  );
}
