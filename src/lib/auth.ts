import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { withStore } from "./store";
import type { Role } from "./types";
import { timingSafeEqual } from "crypto";
import { rateLimited } from "./public-store";

/**
 * Code d'accès au dashboard : variable d'environnement Vercel `APP_ACCESS_CODE`.
 * L'ancien code (publié dans le dépôt) ne sert QUE tant que la variable n'est pas
 * définie, pour éviter de bloquer l'accès pendant la transition.
 */
const LEGACY_ACCESS_CODE = "1076";

function expectedAccessCode(): string {
  const fromEnv = process.env.APP_ACCESS_CODE?.replace(/\s+/g, "").trim();
  if (fromEnv) return fromEnv;
  console.warn("[auth] APP_ACCESS_CODE non défini : ancien code utilisé. À définir dans Vercel.");
  return LEGACY_ACCESS_CODE;
}

function sameCode(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        // Anti force brute : 10 essais / 15 min par IP.
        if (rateLimited(`login:${ip}`, 10, 15 * 60_000)) return null;

        const password = String(credentials?.password ?? "")
          .replace(/\s+/g, "")
          .trim();
        if (!sameCode(password, expectedAccessCode())) return null;

        return withStore(async (store) => {
          const user =
            store.users.find((u) => u.role === "admin" && u.is_active) ??
            store.users.find((u) => u.is_active);
          if (!user) return null;

          user.last_login_at = new Date().toISOString();
          return {
            id: user._id,
            email: user.email,
            name: user.full_name,
            role: user.role as Role,
            artist_id: user.artist_id,
          };
        });
      },
    }),
  ],
});
