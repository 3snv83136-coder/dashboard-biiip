import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { buildSiteStoryJsonLd, withStoryDefaults } from "@/lib/site-story";
import { loadStore, upsertSiteStory } from "@/lib/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const raw = (store.site_stories ?? []).find((s) => s._id === params.id);
  if (!raw) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }

  const story = withStoryDefaults(raw);
  story.is_published = true;
  story.published_at = nowIso();
  story.updated_at = story.published_at;
  story.seo_json_ld = buildSiteStoryJsonLd(story);

  try {
    await upsertSiteStory(story);
  } catch (err) {
    console.error("publish upsert", err);
    return NextResponse.json(
      { error: "Impossible de publier la page" },
      { status: 500 }
    );
  }

  let webhook_ok = false;
  if (process.env.SITE_PUBLISH_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.SITE_PUBLISH_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SITE_REVALIDATE_TOKEN ?? ""}`,
        },
        body: JSON.stringify({
          type: "site_story",
          site_story: story,
          target_url: story.site_target_url,
        }),
      });
      webhook_ok = res.ok;
    } catch {
      webhook_ok = false;
    }
  }

  const message = process.env.SITE_PUBLISH_WEBHOOK_URL
    ? webhook_ok
      ? "Poussé sur biiipcomedyclub.fr ✅"
      : "Publié sur le dashboard — webhook site non joignable"
    : "Publié en aperçu dashboard ✅ (webhook site non configuré)";

  return NextResponse.json({
    site_story: story,
    public_path: story.public_path,
    site_target_url: story.site_target_url,
    webhook_ok,
    message,
  });
}
