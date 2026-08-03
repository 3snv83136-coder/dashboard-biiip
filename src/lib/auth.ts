import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { withStore } from "./store";
import type { Role } from "./types";

/** Code d'accès unique au dashboard (PIN). */
export const APP_ACCESS_CODE = "1076";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const password = String(credentials?.password ?? "")
          .replace(/\s+/g, "")
          .trim();
        if (password !== APP_ACCESS_CODE) return null;

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
