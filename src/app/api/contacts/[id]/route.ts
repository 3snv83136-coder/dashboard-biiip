import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { ContactSource } from "@/lib/types";
import { NextResponse } from "next/server";

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const contact = store.contacts.find((c) => c._id === params.id);
  if (!contact) {
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
  }

  const body = await req.json();
  if (body.full_name !== undefined) {
    const name = String(body.full_name || "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }
    contact.full_name = name;
  }
  if (body.email !== undefined) contact.email = String(body.email || "");
  if (body.phone !== undefined) contact.phone = String(body.phone || "");
  if (body.source !== undefined) {
    contact.source = body.source as ContactSource;
  }
  if (body.consent_marketing !== undefined) {
    contact.consent_marketing = Boolean(body.consent_marketing);
  }
  if (body.tags !== undefined) contact.tags = parseTags(body.tags);
  if (body.last_seen_at !== undefined) {
    contact.last_seen_at = String(body.last_seen_at);
  }
  contact.updated_at = nowIso();

  await saveStore(store);
  return NextResponse.json({ contact });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin"]);
  if (error) return error;

  const store = await loadStore();
  const idx = store.contacts.findIndex((c) => c._id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
  }
  store.contacts.splice(idx, 1);
  await saveStore(store);
  return NextResponse.json({ ok: true });
}
