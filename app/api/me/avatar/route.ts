import { put } from "@vercel/blob";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { requireAccount, respond } from "@/server/http";
import { deleteAvatar } from "@/server/avatars";
import { setImage } from "@/server/profiles";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Troca a foto de perfil: multipart com o campo `file` (JPEG, PNG ou WebP, até 2 MB). */
export async function POST(request: Request) {
  return respond(async () => {
    const accountId = await requireAccount(request);
    const file = (await request.formData().catch(() => null))?.get("file");
    if (!(file instanceof File)) throw new AppError(400, "invalid_request", "Envie a imagem no campo file");
    const extension = TYPES[file.type];
    if (!extension) throw new AppError(400, "invalid_image", "Use uma imagem JPEG, PNG ou WebP");
    if (file.size > MAX_BYTES) throw new AppError(400, "image_too_large", "A imagem pode ter no máximo 2 MB");
    const blob = await put(`avatars/${accountId}.${extension}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });
    await deleteAvatar(await setImage(getDb(), accountId, blob.url));
    return { image: blob.url };
  });
}
