import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const story = (store.site_stories ?? []).find((s) => s._id === params.id);
  if (!story) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }

  story.is_published = true;
  story.published_at = nowIso();
  story.updated_at = story.published_at;

  if (process.env.SITE_PUBLISH_WEBHOOK_URL) {
    try {
      await fetch(process.env.SITE_PUBLISH_WEBHOOK_URL, {
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
    } catch {
      // page dashboard publiée même si webhook site échoue
    }
  }

  await saveStore(store);
  return NextResponse.json({
    site_story: story,
    public_path: story.public_path,
    message: "Page The Biiip Review prête ✅",
  });
}
