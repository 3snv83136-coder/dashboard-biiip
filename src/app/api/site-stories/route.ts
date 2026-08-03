import { requireSession } from "@/lib/api-auth";
import {
  BIIIP_REVIEW_TITLE_EN,
  BIIIP_REVIEW_TITLE_FR,
  PUBLIC_SITE_BASE,
  VENUE_ABOUT,
} from "@/lib/constants";
import { createId, nowIso } from "@/lib/ids";
import {
  buildSiteStoryJsonLd,
  normalizeFaqs,
  withStoryDefaults,
} from "@/lib/site-story";
import {
  buildContextualFaqs,
  ensureFactualFaqs,
} from "@/lib/site-story-draft";
import { slugify } from "@/lib/slugify";
import { loadStore, upsertSiteStory } from "@/lib/store";
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
    site_stories: (store.site_stories ?? [])
      .map(withStoryDefaults)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    shows: store.shows,
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  const body = await req.json();
  const photo_urls = normalizePhotos(body.photo_urls);
  const body_text = String(body.body_text || "").trim();
  const h1 = String(body.h1 || body.title_en || "").trim();
  const title_en = String(body.title_en || BIIIP_REVIEW_TITLE_EN).trim();
  const title_fr = String(body.title_fr || BIIIP_REVIEW_TITLE_FR).trim();
  const video_url = String(body.video_url || "").trim();
  const faqsRaw = ensureFactualFaqs(normalizeFaqs(body.faqs));
  const faqs =
    faqsRaw.length > 0
      ? faqsRaw
      : buildContextualFaqs(body_text || h1, null);
  const author_name = String(
    body.author_name || "Rédaction Biiip Comedy Club"
  ).trim();
  const about_org = String(body.about_org || VENUE_ABOUT).trim() || VENUE_ABOUT;
  const meta_description = String(
    body.meta_description || body_text.slice(0, 155)
  )
    .trim()
    .slice(0, 160);
  const generated_by =
    body.generated_by === "claude" ? "claude" : ("manual" as const);

  const resolvedH1 =
    h1 ||
    title_fr ||
    title_en ||
    body_text.split("\n").find((l) => l.trim())?.slice(0, 80) ||
    "L'avis du Biiip";

  if (!body_text) {
    return NextResponse.json(
      { error: "Le texte est obligatoire — génère à l’IA ou écris quelques lignes" },
      { status: 400 }
    );
  }
  if (photo_urls.length < 1 && !video_url) {
    return NextResponse.json(
      { error: "Ajoute au moins une photo ou une vidéo" },
      { status: 400 }
    );
  }

  const store = await loadStore();
  const ts = nowIso();
  const baseSlug = slugify(
    String(body.slug || resolvedH1 || `${title_en}-${Date.now().toString(36)}`)
  );
  let slug = baseSlug || `the-biiip-review-${Date.now().toString(36)}`;
  const existing = new Set((store.site_stories ?? []).map((s) => s.slug));
  if (existing.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const public_path = `/the-biiip-review/${slug}`;
  const site_target_url = `${PUBLIC_SITE_BASE}/en/the-biiip-review/${slug}`;
  const story: SiteStory = {
    _id: createId("story"),
    title_en,
    title_fr,
    h1: resolvedH1,
    slug,
    meta_description,
    body_text,
    photo_urls,
    video_url,
    faqs,
    author_name,
    about_org,
    seo_json_ld: {},
    show_id: body.show_id ? String(body.show_id) : null,
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
    console.error("site-stories POST", err);
    return NextResponse.json(
      { error: "Impossible d’enregistrer la page" },
      { status: 500 }
    );
  }

  return NextResponse.json({ site_story: story }, { status: 201 });
}
