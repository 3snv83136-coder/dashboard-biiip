import { requireSession } from "@/lib/api-auth";
import {
  generateSiteStoryContent,
  localSiteStoryDraft,
} from "@/lib/claude";
import { loadStore } from "@/lib/store";
import type { Show } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** Hobby Vercel ≈ 10s — ne jamais dépasser. */
export const maxDuration = 10;

/** Avant le kill Vercel : on force un brouillon local. */
const HARD_DEADLINE_MS = 7_800;

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const notes = String(body.notes || body.body_text || "").trim();
  const show_id = body.show_id ? String(body.show_id) : null;
  const has_photo = Boolean(body.has_photo);
  const has_video = Boolean(
    body.has_video || String(body.video_url || "").trim()
  );

  let show: Show | null = null;
  try {
    if (show_id) {
      const store = await loadStore();
      show = store.shows.find((s) => s._id === show_id) ?? null;
    }
  } catch {
    // ok
  }

  const deadline = new Promise<ReturnType<typeof localSiteStoryDraft>>(
    (resolve) => {
      setTimeout(() => resolve(localSiteStoryDraft(notes, show)), HARD_DEADLINE_MS);
    }
  );

  const draft = await Promise.race([
    generateSiteStoryContent({
      notes,
      show,
      has_photo,
      has_video,
    }),
    deadline,
  ]);

  const hasClaudeKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const warning =
    draft.generated_by === "claude"
      ? null
      : hasClaudeKey
        ? "Claude trop lent (limite Vercel) — brouillon enrichi local utilisé."
        : "ANTHROPIC_API_KEY manquante — brouillon local.";

  return NextResponse.json({
    draft,
    ai_status: draft.generated_by,
    warning,
  });
}
