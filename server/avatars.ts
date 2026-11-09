import { del } from "@vercel/blob";

/**
 * A URL é de uma foto que esta Conta enviou? As fotos vão para `avatars/<accountId>-<sufixo>.<ext>`
 * no Vercel Blob (veja app/api/me/avatar). A foto do Google, uma URL de outra Conta ou um texto que
 * nem é URL não são dela, e não podem ser apagados em nome dela.
 */
export function ownsAvatar(url: string | null | undefined, accountId: string): url is string {
  if (!url || !URL.canParse(url)) return false;
  const { hostname, pathname } = new URL(url);
  if (!hostname.endsWith(".blob.vercel-storage.com")) return false;
  return pathname.startsWith(`/avatars/${accountId}-`) || pathname.startsWith(`/avatars/${accountId}.`);
}

/** Apaga a foto de perfil que a Conta enviou ao Vercel Blob; qualquer outra fica como está. */
export async function deleteAvatar(url: string | null | undefined, accountId: string) {
  if (!ownsAvatar(url, accountId)) return;
  await del(url).catch((error) => console.error("[avatar] não deu para apagar", url, error));
}
