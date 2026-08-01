import { requireSession } from "@/lib/api-auth";
import { createId, nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { MediaType } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;
  const store = getStore();
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
  const media_type = (body.media_type || "photo") as MediaType;
  const title = String(body.title || "");
  const caption = String(body.caption || "");
  const alt_text = String(body.alt_text || title || "Photo Biiip Comedy Club");

  const asset = {
    _id: createId("media"),
    show_id: body.show_id ? String(body.show_id) : null,
    media_type,
    file_url,
    thumbnail_url: String(body.thumbnail_url || file_url),
    title,
    alt_text,
    caption,
    seo_json_ld: {
      "@context": "https://schema.org",
      "@type": media_type === "video" ? "VideoObject" : "ImageObject",
      name: title || caption || alt_text,
      contentUrl: file_url,
      description: caption || alt_text,
    },
    site_slug: String(body.site_slug || "/galerie"),
    is_published: false,
    published_at: null as string | null,
    created_at: ts,
    updated_at: ts,
  };

  if (!file_url) {
    return NextResponse.json(
      { error: "Le fichier est obligatoire" },
      { status: 400 }
    );
  }
  if (!title) {
    return NextResponse.json(
      { error: "Le titre est obligatoire" },
      { status: 400 }
    );
  }

  getStore().media_assets.push(asset);
  return NextResponse.json({ media_asset: asset }, { status: 201 });
}
