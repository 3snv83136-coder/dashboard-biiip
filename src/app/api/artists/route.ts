import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { ArtistLevel } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;
  const store = await loadStore();
  return NextResponse.json({
    artists: store.artists.sort((a, b) =>
      a.stage_name.localeCompare(b.stage_name)
    ),
  });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const ts = nowIso();
  const artist = {
    _id: createId("artist"),
    stage_name: String(body.stage_name || "").trim(),
    legal_name: String(body.legal_name || ""),
    email: String(body.email || ""),
    phone: String(body.phone || ""),
    bio: String(body.bio || ""),
    photo_url: String(body.photo_url || ""),
    artist_level: (body.artist_level || "jeune_talent") as ArtistLevel,
    default_fee_amount: Number(body.default_fee_amount ?? 0),
    instagram_handle: String(body.instagram_handle || ""),
    tiktok_handle: String(body.tiktok_handle || ""),
    internal_notes: String(body.internal_notes || ""),
    access_code: "",
    access_code_updated_at: null,
    access_last_login_at: null,
    access_profile_completed_at: null,
    technical_needs: "",
    dietary_notes: "",
    city: String(body.city || ""),
    created_at: ts,
    updated_at: ts,
  };

  if (!artist.stage_name) {
    return NextResponse.json(
      { error: "Le nom de scène est obligatoire" },
      { status: 400 }
    );
  }

  const store = await loadStore();
  store.artists.push(artist);
  await saveStore(store);
  return NextResponse.json({ artist }, { status: 201 });
}
