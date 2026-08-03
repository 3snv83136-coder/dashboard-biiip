import { requireSession } from "@/lib/api-auth";
import { sendDocumentEmail } from "@/lib/brevo";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import { DOC_TYPE_LABELS } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const document = store.documents.find((d) => d._id === params.id);
  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const artist = store.artists.find((a) => a._id === document.artist_id);
  const show = store.shows.find((s) => s._id === document.show_id);
  if (!artist?.email) {
    return NextResponse.json(
      { error: "Email artiste manquant" },
      { status: 400 }
    );
  }

  await sendDocumentEmail(
    artist.email,
    `${DOC_TYPE_LABELS[document.doc_type]} — ${show?.title ?? "Biiip"}`,
    `<pre style="font-family:sans-serif;white-space:pre-wrap">${document.content}</pre>`
  );

  document.doc_status = "sent";
  document.sent_at = nowIso();
  document.updated_at = document.sent_at;

  await saveStore(store);
  return NextResponse.json({ document, message: "C'est envoyé 🎤" });
}
