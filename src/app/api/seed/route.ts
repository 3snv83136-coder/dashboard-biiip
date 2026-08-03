import { requireSession } from "@/lib/api-auth";
import { resetStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST() {
  const { error } = await requireSession(["admin"]);
  if (error) return error;

  const store = await resetStore();
  return NextResponse.json({
    ok: true,
    message: "Données démo réinitialisées",
    counts: {
      users: store.users.length,
      artists: store.artists.length,
      shows: store.shows.length,
    },
  });
}
