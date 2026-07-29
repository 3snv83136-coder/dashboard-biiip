import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { RadioGuestRole } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const guest = store.radio_guests.find((g) => g._id === params.id);
  if (!guest) {
    return NextResponse.json({ error: "Invité introuvable" }, { status: 404 });
  }

  const body = await req.json();
  if (body.guest_name !== undefined) guest.guest_name = String(body.guest_name);
  if (body.guest_role !== undefined) {
    guest.guest_role = body.guest_role as RadioGuestRole;
  }
  if (body.artist_id !== undefined) {
    guest.artist_id = body.artist_id ? String(body.artist_id) : null;
  }
  if (body.slot_order !== undefined) guest.slot_order = Number(body.slot_order);
  if (body.segment_title !== undefined) {
    guest.segment_title = String(body.segment_title);
  }
  if (body.segment_duration_min !== undefined) {
    guest.segment_duration_min = Number(body.segment_duration_min);
  }
  if (body.talking_points !== undefined) {
    guest.talking_points = String(body.talking_points);
  }
  guest.updated_at = nowIso();

  return NextResponse.json({ radio_guest: guest });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const idx = store.radio_guests.findIndex((g) => g._id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Invité introuvable" }, { status: 404 });
  }
  store.radio_guests.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
