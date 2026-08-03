import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { RadioEpisode, RadioEpisodeStatus, RadioGuest } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  return NextResponse.json({
    radio_episodes: store.radio_episodes.sort((a, b) =>
      a.episode_date.localeCompare(b.episode_date)
    ),
    radio_guests: store.radio_guests,
    artists: store.artists,
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  const body = await req.json();
  const ts = nowIso();
  const episode: RadioEpisode = {
    _id: createId("radio"),
    title: String(body.title || "Radioactive").trim(),
    episode_date: String(body.episode_date),
    start_time: String(body.start_time || "19:00"),
    end_time: String(body.end_time || "20:00"),
    episode_status: (body.episode_status || "draft") as RadioEpisodeStatus,
    theme: String(body.theme || ""),
    synopsis: String(body.synopsis || ""),
    host_name: String(body.host_name || ""),
    conductor_content: String(body.conductor_content || ""),
    playlist_notes: String(body.playlist_notes || ""),
    technical_notes: String(body.technical_notes || ""),
    stream_url: String(body.stream_url || ""),
    internal_notes: String(body.internal_notes || ""),
    created_by: gate.session.user.id,
    created_at: ts,
    updated_at: ts,
  };

  if (!episode.episode_date) {
    return NextResponse.json(
      { error: "La date est obligatoire" },
      { status: 400 }
    );
  }

  const store = await loadStore();
  store.radio_episodes.push(episode);

  const guestsInput: Array<{
    artist_id?: string | null;
    guest_name?: string;
    guest_role?: string;
    segment_title?: string;
    segment_duration_min?: number;
    talking_points?: string;
  }> = Array.isArray(body.guests) ? body.guests : [];

  const createdGuests: RadioGuest[] = guestsInput.map((g, index) => {
    const artist = g.artist_id
      ? store.artists.find((a) => a._id === g.artist_id)
      : null;
    const guest: RadioGuest = {
      _id: createId("rguest"),
      radio_episode_id: episode._id,
      artist_id: g.artist_id ? String(g.artist_id) : null,
      guest_name: String(g.guest_name || artist?.stage_name || "Invité"),
      guest_role: (g.guest_role || "invite") as RadioGuest["guest_role"],
      slot_order: index + 1,
      segment_title: String(g.segment_title || ""),
      segment_duration_min: Number(g.segment_duration_min ?? 15),
      talking_points: String(g.talking_points || ""),
      created_at: ts,
      updated_at: ts,
    };
    store.radio_guests.push(guest);
    return guest;
  });

  await saveStore(store);
  return NextResponse.json(
    { radio_episode: episode, radio_guests: createdGuests },
    { status: 201 }
  );
}
