import type { DefaultSession } from "next-auth";
import type { Role } from "./types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      artist_id: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    artist_id: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    artist_id?: string | null;
  }
}
