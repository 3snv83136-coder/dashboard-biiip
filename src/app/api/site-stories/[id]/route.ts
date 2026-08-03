import { requireSession } from "@/lib/api-auth";
import { deleteSiteStory, loadStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
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
  return NextResponse.json({ site_story: story });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const ok = await deleteSiteStory(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
