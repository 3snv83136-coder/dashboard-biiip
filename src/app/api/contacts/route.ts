import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { ContactSource } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const tag = searchParams.get("tag") || "";

  let contacts = getStore().contacts;
  if (q) {
    contacts = contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }
  if (tag) {
    contacts = contacts.filter((c) => c.tags.includes(tag));
  }

  return NextResponse.json({
    contacts: contacts.sort((a, b) => a.full_name.localeCompare(b.full_name)),
  });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const ts = nowIso();
  const contact = {
    _id: createId("contact"),
    full_name: String(body.full_name || "").trim(),
    email: String(body.email || ""),
    phone: String(body.phone || ""),
    source: (body.source || "manuel") as ContactSource,
    consent_marketing: Boolean(body.consent_marketing),
    tags: Array.isArray(body.tags)
      ? body.tags.map(String)
      : String(body.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    first_seen_at: ts,
    last_seen_at: ts,
    created_at: ts,
    updated_at: ts,
  };

  if (!contact.full_name) {
    return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
  }

  getStore().contacts.push(contact);
  return NextResponse.json({ contact }, { status: 201 });
}
