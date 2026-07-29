import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { ArtistLevel } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const artist = store.artists.find((a) => a._id === params.id);
  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  const bookings = store.show_bookings.filter((b) => b.artist_id === artist._id);
  const shows = store.shows.filter((s) =>
    bookings.some((b) => b.show_id === s._id)
  );
  const documents = store.documents.filter((d) => d.artist_id === artist._id);

  return NextResponse.json({ artist, shows, show_bookings: bookings, documents });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const artist = store.artists.find((a) => a._id === params.id);
  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const fields = [
    "stage_name",
    "legal_name",
    "email",
    "phone",
    "bio",
    "photo_url",
    "instagram_handle",
    "tiktok_handle",
    "internal_notes",
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) {
      artist[field] = String(body[field]);
    }
  }
  if (body.artist_level !== undefined) {
    artist.artist_level = body.artist_level as ArtistLevel;
  }
  if (body.default_fee_amount !== undefined) {
    artist.default_fee_amount = Number(body.default_fee_amount);
  }
  artist.updated_at = nowIso();

  return NextResponse.json({ artist });
}
