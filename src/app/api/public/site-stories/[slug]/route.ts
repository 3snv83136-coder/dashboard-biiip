import { withStoryDefaults } from "@/lib/site-story";
import { loadStore } from "@/lib/store";
import { NextResponse } from "next/server";

/** Lecture publique d'une story publiée (pour la page /the-biiip-review/[slug]). */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const store = await loadStore();
  const story = (store.site_stories ?? []).find((s) => s.slug === params.slug);
  if (!story || !story.is_published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ site_story: withStoryDefaults(story) });
}
