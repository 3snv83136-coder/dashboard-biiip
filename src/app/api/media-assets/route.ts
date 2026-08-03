import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { MediaType } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;
  const store = await loadStore();
  return NextResponse.json({
    media_assets: store.media_assets,
    shows: store.shows,
  });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const ts = nowIso();
  const file_url = String(body.file_url || "");
  const alt_text = String(body.alt_text || "Photo Biiip Comedy Club");
  const caption = String(body.caption || "");

  const asset = {
    _id: createId("media"),
    show_id: body.show_id ? String(body.show_id) : null,
    media_type: (body.media_type || "photo") as MediaType,
    file_url,
    thumbnail_url: String(body.thumbnail_url || file_url),
    alt_text,
    caption,
    seo_json_ld: {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      name: caption || alt_text,
      contentUrl: file_url,
      description: alt_text,
    },
    site_slug: String(body.site_slug || "/galerie"),
    is_published: false,
    published_at: null as string | null,
    created_at: ts,
    updated_at: ts,
  };

  if (!file_url) {
    return NextResponse.json(
      { error: "L'URL du fichier est obligatoire" },
      { status: 400 }
    );
  }

  const store = await loadStore();
  store.media_assets.push(asset);
  await saveStore(store);
  return NextResponse.json({ media_asset: asset }, { status: 201 });
}
