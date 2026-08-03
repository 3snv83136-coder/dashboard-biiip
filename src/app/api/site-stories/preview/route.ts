import { requireSession } from "@/lib/api-auth";
import {
  BIIIP_REVIEW_TITLE_EN,
  BIIIP_REVIEW_TITLE_FR,
  PUBLIC_SITE_BASE,
  VENUE_ABOUT,
} from "@/lib/constants";
import { createId, nowIso } from "@/lib/ids";
import { buildSiteStoryJsonLd, normalizeFaqs } from "@/lib/site-story";
import {
  ensureFactualFaqs,
  localSiteStoryDraft,
} from "@/lib/site-story-draft";
import { slugify } from "@/lib/slugify";
import { loadStore, upsertSiteStory } from "@/lib/store";
import type { SiteStory } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * Crée l’aperçu SANS appeler Claude (rapide, stable sur Vercel Hobby).
 * Le texte IA doit être généré avant via /api/site-stories/generate.
 */
export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const notes = String(body.notes || "").trim();
  const photo_urls = (
    Array.isArray(body.photo_urls) ? body.photo_urls.map(String) : []
  )
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 3);
  const video_url = String(body.video_url || "").trim();
  const show_id = body.show_id ? String(body.show_id) : null;

  if (photo_urls.length < 1 && !video_url) {
    return NextResponse.json(
      { error: "Ajoute au moins une photo ou une vidéo" },
      { status: 400 }
    );
  }

  const fallback = localSiteStoryDraft(notes);
  const h1 = String(body.h1 || "").trim() || fallback.h1;
  const body_text = String(body.body_text || "").trim() || fallback.body_text;
  let faqs = ensureFactualFaqs(normalizeFaqs(body.faqs));
  if (!faqs.length) faqs = fallback.faqs;
  const meta_description =
    String(body.meta_description || "").trim() || fallback.meta_description;
  const slugHint = String(body.slug || "").trim() || fallback.slug || h1;
  const generated_by =
    body.generated_by === "claude" ? "claude" : ("manual" as const);
  const author_name =
    String(body.author_name || "").trim() || fallback.author_name;
  const about_org = VENUE_ABOUT;

  const ts = nowIso();
  let storeSlugs = new Set<string>();
  try {
    const store = await loadStore();
    storeSlugs = new Set((store.site_stories ?? []).map((s) => s.slug));
  } catch {
    // ok
  }

  const baseSlug = slugify(slugHint || h1 || `avis-biiip-${Date.now()}`);
  let slug = baseSlug || `avis-biiip-${Date.now().toString(36)}`;
  if (storeSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const public_path = `/the-biiip-review/${slug}`;
  const site_target_url = `${PUBLIC_SITE_BASE}/en/the-biiip-review/${slug}`;

  const story: SiteStory = {
    _id: createId("story"),
    title_en: BIIIP_REVIEW_TITLE_EN,
    title_fr: BIIIP_REVIEW_TITLE_FR,
    h1,
    slug,
    meta_description: meta_description.slice(0, 160),
    body_text,
    photo_urls,
    video_url,
    faqs,
    author_name,
    about_org,
    seo_json_ld: {},
    show_id,
    is_published: false,
    published_at: null,
    public_path,
    site_target_url,
    generated_by,
    created_by: gate.session.user.id,
    created_at: ts,
    updated_at: ts,
  };
  story.seo_json_ld = buildSiteStoryJsonLd(story);

  try {
    await upsertSiteStory(story);
  } catch (err) {
    console.error("preview upsert", err);
    return NextResponse.json(
      { error: "Impossible d’enregistrer l’aperçu (base de données)." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      site_story: story,
      public_path: story.public_path,
      preview_url: `${story.public_path}?preview=1`,
      ai_status: generated_by,
      message: "Aperçu créé ✅",
    },
    { status: 201 }
  );
}
