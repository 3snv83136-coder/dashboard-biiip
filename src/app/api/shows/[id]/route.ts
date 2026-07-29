import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { BookingStatus, ShowType } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const show = store.shows.find((s) => s._id === params.id);
  if (!show) {
    return NextResponse.json({ error: "Show introuvable" }, { status: 404 });
  }

  const body = await req.json();
  if (body.title !== undefined) show.title = String(body.title);
  if (body.show_date !== undefined) show.show_date = String(body.show_date);
  if (body.start_time !== undefined) show.start_time = String(body.start_time);
  if (body.show_type !== undefined) show.show_type = body.show_type as ShowType;
  if (body.booking_status !== undefined) {
    show.booking_status = body.booking_status as BookingStatus;
  }
  if (body.capacity !== undefined) show.capacity = Number(body.capacity);
  if (body.billetweb_url !== undefined) {
    show.billetweb_url = String(body.billetweb_url);
  }
  if (body.internal_notes !== undefined) {
    show.internal_notes = String(body.internal_notes);
  }
  show.updated_at = nowIso();

  return NextResponse.json({ show });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin"]);
  if (error) return error;

  const store = getStore();
  const idx = store.shows.findIndex((s) => s._id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Show introuvable" }, { status: 404 });
  }

  store.shows.splice(idx, 1);
  store.show_bookings = store.show_bookings.filter((b) => b.show_id !== params.id);
  store.documents = store.documents.filter((d) => d.show_id !== params.id);

  return NextResponse.json({ ok: true });
}
