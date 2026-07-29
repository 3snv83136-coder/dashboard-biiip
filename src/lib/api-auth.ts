import { auth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { NextResponse } from "next/server";

export async function requireSession(roles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
