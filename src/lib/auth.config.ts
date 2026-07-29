import type { NextAuthConfig } from "next-auth";
import type { Role } from "./types";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.artist_id = (user as { artist_id: string | null }).artist_id;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.artist_id = (token.artist_id as string | null) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
};
