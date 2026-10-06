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
      { error: "Colle au moins un nom, un SMS ou un texte OCR." },
      { status: 400 }
    );
  }

  const parsed = parseWhatsAppArtistList(raw);
  if (!parsed.length) {
    return NextResponse.json(
      { error: "Aucun contact reconnu. Sépare les fiches par une ligne vide." },
      { status: 400 }
    );
  }

  const store = await loadStore();
  const byName = new Map(
    store.artists.map((a) => [a.stage_name.toLowerCase(), a] as const)
  );
  const byPhone = new Map(
    store.artists
      .filter((a) => a.phone)
      .map((a) => [a.phone.replace(/\D/g, ""), a] as const)
  );

  const ts = nowIso();
  const created: Artist[] = [];
  const updated: Artist[] = [];
  const skipped: string[] = [];

  for (const row of parsed) {
    const phoneKey = row.phone.replace(/\D/g, "");
    const existing =
      (phoneKey && byPhone.get(phoneKey)) ||
      byName.get(row.stage_name.toLowerCase()) ||
      null;

    if (existing) {
      let changed = false;
      if (row.phone && !existing.phone) {
        existing.phone = row.phone;
        changed = true;
      }
      if (row.email && !existing.email) {
        existing.email = row.email;
        changed = true;
      }
      if (row.address_line && row.address_line !== existing.address_line) {
        existing.address_line = row.address_line;
        changed = true;
      }
      if (row.postal_code && row.postal_code !== existing.postal_code) {
        existing.postal_code = row.postal_code;
        changed = true;
      }
      if (row.city && row.city !== existing.city) {
        existing.city = row.city;
        changed = true;
      }
      if (changed) {
        existing.updated_at = ts;
        updated.push(existing);
      } else {
        skipped.push(row.stage_name);
      }
      continue;
    }

    const artist: Artist = {
      _id: createId("artist"),
      stage_name: row.stage_name,
      legal_name: row.legal_name,
      email: row.email,
      phone: row.phone,
      bio: "",
      photo_url: "",
      artist_level: "jeune_talent",
      default_fee_amount: 0,
      instagram_handle: "",
      tiktok_handle: "",
      internal_notes: "import sms/ocr",
      access_code: "",
      access_code_updated_at: null,
      access_last_login_at: null,
      access_profile_completed_at: null,
      technical_needs: "",
      dietary_notes: "",
      address_line: row.address_line,
      postal_code: row.postal_code,
      city: row.city,
      created_at: ts,
      updated_at: ts,
    };
    store.artists.push(artist);
    byName.set(artist.stage_name.toLowerCase(), artist);
    if (phoneKey) byPhone.set(phoneKey, artist);
    created.push(artist);
  }

  if (created.length || updated.length) await saveStore(store);

  const parts: string[] = [];
  if (created.length) {
    parts.push(
      `${created.length} créé${created.length > 1 ? "s" : ""}`
    );
  }
  if (updated.length) {
    parts.push(
      `${updated.length} adresse${updated.length > 1 ? "s" : ""} mise${updated.length > 1 ? "s" : ""} à jour`
    );
  }
  if (skipped.length) {
    parts.push(`${skipped.length} déjà à jour`);
  }

  return NextResponse.json({
    created,
    updated,
    skipped,
    message: parts.length ? `${parts.join(" · ")} ✅` : "Rien à importer.",
  });
}
