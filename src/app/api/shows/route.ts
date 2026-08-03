import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { BookingStatus, ShowType } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff", "artist"]);
  if (error) return error;

  const store = await loadStore();
  const session = (await requireSession())!.session!;
  let shows = store.shows;
  let bookings = store.show_bookings;

  if (session.user.role === "artist" && session.user.artist_id) {
    const myShowIds = new Set(
      bookings
        .filter((b) => b.artist_id === session.user.artist_id)
        .map((b) => b.show_id)
    );
    shows = shows.filter((s) => myShowIds.has(s._id));
    bookings = bookings.filter((b) => b.artist_id === session.user.artist_id);
  }

  return NextResponse.json({
    shows: shows.sort((a, b) => a.show_date.localeCompare(b.show_date)),
    show_bookings: bookings,
    artists: store.artists,
  });
}

export async function POST(req: Request) {
  const { session, error } = await requireSession(["admin", "staff"]);
  if (error || !session) return error;

  const body = await req.json();
  const store = await loadStore();
  const ts = nowIso();

  const show = {
    _id: createId("show"),
    title: String(body.title || "Plateau Biiip"),
    show_date: String(body.show_date),
    start_time: String(body.start_time || "20:30"),
    show_type: (body.show_type || "plateau") as ShowType,
    booking_status: (body.booking_status || "pressenti") as BookingStatus,
    capacity: Number(body.capacity ?? 19),
    billetweb_url: String(body.billetweb_url || ""),
    internal_notes: String(body.internal_notes || ""),
    created_by: session.user.id,
    created_at: ts,
    updated_at: ts,
  };

  store.shows.push(show);

  const artistIds: string[] = Array.isArray(body.artist_ids)
    ? body.artist_ids
    : [];
  const createdBookings = artistIds.map((artist_id, index) => {
    const artist = store.artists.find((a) => a._id === artist_id);
    const booking = {
      _id: createId("booking"),
      show_id: show._id,
      artist_id,
      slot_order: index + 1,
      set_duration_min: Number(body.set_duration_min ?? 15),
      fee_amount: Number(body.fee_amount ?? artist?.default_fee_amount ?? 0),
      booking_status: show.booking_status,
      created_at: ts,
      updated_at: ts,
    };
    store.show_bookings.push(booking);
    return booking;
  });

  await saveStore(store);
  return NextResponse.json({ show, show_bookings: createdBookings }, { status: 201 });
}
