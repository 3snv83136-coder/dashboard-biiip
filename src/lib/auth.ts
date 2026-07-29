import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { getStore } from "./store";
import type { Role } from "./types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const store = getStore();
        const user = store.users.find(
          (u) => u.email.toLowerCase() === email && u.is_active
        );
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        user.last_login_at = new Date().toISOString();
        return {
          id: user._id,
          email: user.email,
          name: user.full_name,
          role: user.role as Role,
          artist_id: user.artist_id,
        };
      },
    }),
  ],
});
