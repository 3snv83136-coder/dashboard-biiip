import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { RadioGuest, RadioGuestRole } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const store = await loadStore();
  const episode = store.radio_episodes.find(
    (e) => e._id === body.radio_episode_id
  );
  if (!episode) {
    return NextResponse.json(
      { error: "Émission introuvable" },
      { status: 404 }
    );
  }

  const artist = body.artist_id
    ? store.artists.find((a) => a._id === body.artist_id)
    : null;

  const existing = store.radio_guests.filter(
    (g) => g.radio_episode_id === episode._id
  );
  const ts = nowIso();

  const guest: RadioGuest = {
    _id: createId("rguest"),
    radio_episode_id: episode._id,
    artist_id: body.artist_id ? String(body.artist_id) : null,
    guest_name: String(
      body.guest_name || artist?.stage_name || ""
    ).trim(),
    guest_role: (body.guest_role || "invite") as RadioGuestRole,
    slot_order: Number(body.slot_order ?? existing.length + 1),
    segment_title: String(body.segment_title || ""),
    segment_duration_min: Number(body.segment_duration_min ?? 15),
    talking_points: String(body.talking_points || ""),
    created_at: ts,
    updated_at: ts,
  };

  if (!guest.guest_name) {
    return NextResponse.json(
      { error: "Le nom de l'invité est obligatoire" },
      { status: 400 }
    );
  }

  store.radio_guests.push(guest);
  await saveStore(store);
  return NextResponse.json({ radio_guest: guest }, { status: 201 });
}
