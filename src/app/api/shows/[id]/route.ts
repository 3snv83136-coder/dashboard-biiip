import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { purgeShowPublicData } from "@/lib/public-store";
import { loadStore, saveStore } from "@/lib/store";
import type { BookingStatus, ShowType } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
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
  if (body.is_avant_premiere !== undefined) {
    show.is_avant_premiere = Boolean(body.is_avant_premiere);
  }
  if (body.is_public_booking !== undefined) {
    show.is_public_booking = Boolean(body.is_public_booking);
  }
  if (body.internal_notes !== undefined) {
    show.internal_notes = String(body.internal_notes);
  }

  let show_bookings = store.show_bookings.filter((b) => b.show_id === show._id);

  if (Array.isArray(body.artist_ids)) {
    const seen = new Set<string>();
    const artist_ids: string[] = [];
    for (const raw of body.artist_ids) {
      const id = String(raw);
      if (seen.has(id)) continue;
      if (!store.artists.some((a) => a._id === id)) continue;
      seen.add(id);
      artist_ids.push(id);
    }
    const ts = nowIso();
    const existingByArtist = new Map(
      show_bookings.map((b) => [b.artist_id, b] as const)
    );
    const next = artist_ids.map((artist_id, index) => {
      const prev = existingByArtist.get(artist_id);
      if (prev) {
        prev.slot_order = index + 1;
        prev.booking_status = show.booking_status;
        prev.updated_at = ts;
        return prev;
      }
      const artist = store.artists.find((a) => a._id === artist_id);
      return {
        _id: createId("booking"),
        show_id: show._id,
        artist_id,
        slot_order: index + 1,
        set_duration_min: Number(body.set_duration_min ?? 15),
        fee_amount: Number(
          body.fee_amount ?? artist?.default_fee_amount ?? 0
        ),
        booking_status: show.booking_status,
        created_at: ts,
        updated_at: ts,
      };
    });
    store.show_bookings = [
      ...store.show_bookings.filter((b) => b.show_id !== show._id),
      ...next,
    ];
    show_bookings = next;
  }

  show.updated_at = nowIso();

  await saveStore(store);
  return NextResponse.json({ show, show_bookings });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const idx = store.shows.findIndex((s) => s._id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Show introuvable" }, { status: 404 });
  }

  store.shows.splice(idx, 1);
  store.show_bookings = store.show_bookings.filter((b) => b.show_id !== params.id);
  store.documents = store.documents.filter((d) => d.show_id !== params.id);

  await saveStore(store);
  await purgeShowPublicData(params.id);

  return NextResponse.json({ ok: true });
}
