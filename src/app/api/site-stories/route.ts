import { requireSession } from "@/lib/api-auth";
import {
  BIIIP_REVIEW_TITLE_EN,
  BIIIP_REVIEW_TITLE_FR,
  PUBLIC_SITE_BASE,
} from "@/lib/constants";
import { createId, nowIso } from "@/lib/ids";
import { slugify } from "@/lib/slugify";
import { loadStore, saveStore } from "@/lib/store";
import type { SiteStory } from "@/lib/types";
import { NextResponse } from "next/server";

function normalizePhotos(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw.map(String)
    : String(raw || "")
        .split("\n")
        .map((s) => s.trim());
  return list.map((u) => u.trim()).filter(Boolean).slice(0, 3);
}

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;
  const store = await loadStore();
  return NextResponse.json({
    site_stories: (store.site_stories ?? []).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
    shows: store.shows,
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  const body = await req.json();
  const photo_urls = normalizePhotos(body.photo_urls);
  const body_text = String(body.body_text || "").trim();
  const title_en = String(body.title_en || BIIIP_REVIEW_TITLE_EN).trim();
  const title_fr = String(body.title_fr || BIIIP_REVIEW_TITLE_FR).trim();
  const video_url = String(body.video_url || "").trim();

  if (!body_text) {
    return NextResponse.json(
      { error: "Le texte est obligatoire" },
      { status: 400 }
    );
  }
  if (photo_urls.length < 1) {
    return NextResponse.json(
      { error: "Ajoute au moins 1 photo (URL)" },
      { status: 400 }
    );
  }

  const store = await loadStore();
  const ts = nowIso();
  const baseSlug = slugify(
    String(body.slug || `${title_en}-${Date.now().toString(36)}`)
  );
  let slug = baseSlug || `the-biiip-review-${Date.now().toString(36)}`;
  const existing = new Set((store.site_stories ?? []).map((s) => s.slug));
  if (existing.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const public_path = `/the-biiip-review/${slug}`;
  const story: SiteStory = {
    _id: createId("story"),
    title_en,
    title_fr,
    slug,
    body_text,
    photo_urls,
    video_url,
    show_id: body.show_id ? String(body.show_id) : null,
    is_published: false,
    published_at: null,
    public_path,
    site_target_url: `${PUBLIC_SITE_BASE}/en/the-biiip-review/${slug}`,
    created_by: gate.session.user.id,
    created_at: ts,
    updated_at: ts,
  };

  if (!store.site_stories) store.site_stories = [];
  store.site_stories.push(story);
  await saveStore(store);

  return NextResponse.json({ site_story: story }, { status: 201 });
}
