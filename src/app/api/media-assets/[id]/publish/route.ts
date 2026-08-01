import { requireSession } from "@/lib/api-auth";
import { nowIso } from "@/lib/ids";
import { buildLlmsTxt } from "@/lib/llms-txt";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = getStore();
  const asset = store.media_assets.find((m) => m._id === params.id);
  if (!asset) {
    return NextResponse.json({ error: "Média introuvable" }, { status: 404 });
  }

  asset.is_published = true;
  asset.published_at = nowIso();
  asset.updated_at = asset.published_at;

  // Optionnel : webhook site public — pousse le média (JSON + JSON-LD) et le llms.txt à jour
  if (process.env.SITE_PUBLISH_WEBHOOK_URL) {
    try {
      const llms_txt = buildLlmsTxt(store.media_assets);
      await fetch(process.env.SITE_PUBLISH_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SITE_REVALIDATE_TOKEN ?? ""}`,
        },
        body: JSON.stringify({ media_asset: asset, llms_txt }),
      });
    } catch {
      // publication locale OK même si webhook échoue
    }
  }

  return NextResponse.json({
    media_asset: asset,
    message: "Publié sur le site ✅",
  });
}
