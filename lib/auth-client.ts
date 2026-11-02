"use client";

import { inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/server/auth";

/**
 * Login no navegador: `authClient.signIn.social({ provider: "google" })`,
 * `authClient.signIn.magicLink({ email })`, `authClient.useSession()` (com `user.handle` e
 * `user.bio`) e `authClient.signOut()`.
 */
export const authClient = createAuthClient({ plugins: [magicLinkClient(), inferAdditionalFields<typeof auth>()] });
