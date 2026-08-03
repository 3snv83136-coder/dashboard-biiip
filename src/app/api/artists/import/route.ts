import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import { parseWhatsAppArtistList } from "@/lib/whatsapp-import";
import type { Artist } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const raw = String(body.text || "");
  if (!raw.trim()) {
    return NextResponse.json(
      { error: "Colle au moins un nom." },
      { status: 400 }
    );
  }

  const parsed = parseWhatsAppArtistList(raw);
  if (!parsed.length) {
    return NextResponse.json(
      { error: "Aucun nom reconnu dans le texte." },
      { status: 400 }
    );
  }

  const store = await loadStore();
  const existing = new Set(
    store.artists.map((a) => a.stage_name.toLowerCase())
  );
  const ts = nowIso();
  const created: Artist[] = [];
  const skipped: string[] = [];

  for (const row of parsed) {
    const key = row.stage_name.toLowerCase();
    if (existing.has(key)) {
      skipped.push(row.stage_name);
      continue;
    }
    existing.add(key);

    const artist: Artist = {
      _id: createId("artist"),
      stage_name: row.stage_name,
      legal_name: row.legal_name,
      email: "",
      phone: row.phone,
      bio: "",
      photo_url: "",
      artist_level: "jeune_talent",
      default_fee_amount: 0,
      instagram_handle: "",
      tiktok_handle: "",
      internal_notes: "import whatsapp",
      access_code: "",
      access_code_updated_at: null,
      access_last_login_at: null,
      access_profile_completed_at: null,
      technical_needs: "",
      dietary_notes: "",
      city: "",
      created_at: ts,
      updated_at: ts,
    };
    store.artists.push(artist);
    created.push(artist);
  }

  if (created.length) await saveStore(store);
  return NextResponse.json({
    created,
    skipped,
    message:
      created.length > 0
        ? `${created.length} artiste${created.length > 1 ? "s" : ""} importé${created.length > 1 ? "s" : ""} ✅`
        : "Rien de nouveau — tous étaient déjà dans le répertoire.",
  });
}
