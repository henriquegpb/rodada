import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { deleteAvatar } from "./avatars";
import { getDb } from "./db";
import { account, session, user, verification } from "./db/schema";
import { leaveAllGroups } from "./groups";
import { uniqueHandle } from "./profiles";

/**
 * Login: Google e link mágico por e-mail, sem senha. A sessão fica num cookie; as rotas leem com
 * `auth.api.getSession` (veja ./http.ts).
 */

/** Envia o link mágico pela API do Resend. Sem RESEND_API_KEY (desenvolvimento), só mostra no terminal. */
async function sendMagicLink({ email, url }: { email: string; url: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[auth] link mágico para ${email}: ${url}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Rodada <login@rodada.io>",
      to: email,
      subject: "Seu link para entrar no Rodada",
      html: `<p>Clique para entrar no Rodada:</p><p><a href="${url}">Entrar</a></p><p>O link vale por 5 minutos.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}`);
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema: { user, session, account, verification } }),
  socialProviders: google,
  // A sessão fica assinada no cookie por 5 minutos: a maioria dos pedidos não consulta o banco.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  user: {
    additionalFields: {
      handle: { type: "string", required: false, input: false },
      bio: { type: "string", required: false, input: false, defaultValue: "" },
    },
    deleteUser: {
      enabled: true,
      // As partidas e o resto saem em cascata; Grupos passam adiante e a foto sai do Blob.
      beforeDelete: async (deleted) => {
        await leaveAllGroups(getDb(), deleted.id);
        await deleteAvatar(deleted.image);
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Toda Conta nasce com um handle livre (do nome ou do e-mail); dá para trocar no Perfil.
        before: async (data) => ({
          data: { ...data, handle: await uniqueHandle(getDb(), data.name || "", data.email) },
        }),
      },
    },
  },
  plugins: [magicLink({ sendMagicLink }), nextCookies()],
});
