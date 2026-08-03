import { requireSession } from "@/lib/api-auth";
import { sendDocumentEmail } from "@/lib/brevo";
import { generateDocumentContent } from "@/lib/claude";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { DocStatus, DocType, DocumentRecord } from "@/lib/types";
import { DOC_TYPE_LABELS } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function GET() {
  const gate = await requireSession(["admin", "staff", "artist"]);
  if (gate.error || !gate.session) return gate.error;

  const store = await loadStore();
  let documents = store.documents;

  if (gate.session.user.role === "artist" && gate.session.user.artist_id) {
    documents = documents.filter(
      (d) => d.artist_id === gate.session!.user.artist_id
    );
  }

  return NextResponse.json({
    documents,
    shows: store.shows,
    artists: store.artists,
  });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const store = await loadStore();
  const show = store.shows.find((s) => s._id === body.show_id);
  const artist = store.artists.find((a) => a._id === body.artist_id);
  if (!show || !artist) {
    return NextResponse.json(
      { error: "Show ou artiste introuvable" },
      { status: 404 }
    );
  }

  const doc_type = (body.doc_type || "conducteur") as DocType;
  const generated = await generateDocumentContent({ doc_type, show, artist });
  const ts = nowIso();

  const document: DocumentRecord = {
    _id: createId("doc"),
    show_id: show._id,
    artist_id: artist._id,
    doc_type,
    file_url: "",
    generated_by: generated.generated_by,
    doc_status: "draft" as DocStatus,
    content: generated.content,
    sent_at: null,
    created_at: ts,
    updated_at: ts,
  };

  store.documents.push(document);

  if (body.send) {
    await sendDocumentEmail(
      artist.email,
      `${DOC_TYPE_LABELS[doc_type]} — ${show.title}`,
      `<pre style="font-family:sans-serif;white-space:pre-wrap">${generated.content}</pre>`
    );
    document.doc_status = "sent";
    document.sent_at = nowIso();
    document.updated_at = document.sent_at;
  }

  await saveStore(store);
  return NextResponse.json({ document }, { status: 201 });
}
