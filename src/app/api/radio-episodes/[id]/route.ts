import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { RadioEpisodeStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const episode = store.radio_episodes.find((e) => e._id === params.id);
  if (!episode) {
    return NextResponse.json(
      { error: "Émission introuvable" },
      { status: 404 }
    );
  }

  const guests = store.radio_guests
    .filter((g) => g.radio_episode_id === episode._id)
    .sort((a, b) => a.slot_order - b.slot_order);

  return NextResponse.json({
    radio_episode: episode,
    radio_guests: guests,
    artists: store.artists,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const episode = store.radio_episodes.find((e) => e._id === params.id);
  if (!episode) {
    return NextResponse.json(
      { error: "Émission introuvable" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const stringFields = [
    "title",
    "episode_date",
    "start_time",
    "end_time",
    "theme",
    "synopsis",
    "host_name",
    "conductor_content",
    "playlist_notes",
    "technical_notes",
    "stream_url",
    "internal_notes",
  ] as const;

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      episode[field] = String(body[field]);
    }
  }
  if (body.episode_status !== undefined) {
    episode.episode_status = body.episode_status as RadioEpisodeStatus;
  }
  episode.updated_at = nowIso();

  return NextResponse.json({ radio_episode: episode });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const idx = store.radio_episodes.findIndex((e) => e._id === params.id);
  if (idx === -1) {
    return NextResponse.json(
      { error: "Émission introuvable" },
      { status: 404 }
    );
  }

  store.radio_episodes.splice(idx, 1);
  store.radio_guests = store.radio_guests.filter(
    (g) => g.radio_episode_id !== params.id
  );

  return NextResponse.json({ ok: true });
}
