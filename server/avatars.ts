import { del } from "@vercel/blob";

/** Apaga uma foto de perfil enviada ao Vercel Blob; a do Google (ou nenhuma) fica como está. */
export async function deleteAvatar(url: string | null | undefined) {
  if (!url || !new URL(url).hostname.endsWith(".blob.vercel-storage.com")) return;
  await del(url).catch((error) => console.error("[avatar] não deu para apagar", url, error));
}
