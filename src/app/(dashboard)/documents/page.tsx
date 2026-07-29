"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DOC_TYPE_LABELS } from "@/lib/constants";
import type { Artist, DocType, DocumentRecord, Show } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [showId, setShowId] = useState("");
  const [artistId, setArtistId] = useState("");
  const [docType, setDocType] = useState<DocType>("conducteur");
  const [send, setSend] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<DocumentRecord | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    const json = await res.json();
    setDocuments(json.documents ?? []);
    setShows(json.shows ?? []);
    setArtists(json.artists ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        show_id: showId,
        artist_id: artistId,
        doc_type: docType,
        send,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage("Ça n'est pas passé. On réessaie ?");
      return;
    }
    const json = await res.json();
    setPreview(json.document);
    setMessage(send ? "C'est envoyé 🎤" : "Document généré ✅");
    await load();
  }

  async function sendDoc(id: string) {
    const res = await fetch(`/api/documents/${id}/send`, { method: "POST" });
    const json = await res.json();
    setMessage(json.message || "C'est envoyé 🎤");
    await load();
  }

  function labelShow(id: string) {
    return shows.find((s) => s._id === id)?.title ?? id;
  }
  function labelArtist(id: string) {
    return artists.find((a) => a._id === id)?.stage_name ?? id;
  }

  return (
    <div className="space-y-6">
      <div className="panel grid gap-3 p-5 md:grid-cols-2">
        <div>
          <label className="label-field">Soirée</label>
          <select
            className="input-field"
            value={showId}
            onChange={(e) => setShowId(e.target.value)}
          >
            <option value="">Choisir…</option>
            {shows.map((s) => (
              <option key={s._id} value={s._id}>
                {s.show_date} · {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Artiste</label>
          <select
            className="input-field"
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
          >
            <option value="">Choisir…</option>
            {artists.map((a) => (
              <option key={a._id} value={a._id}>
                {a.stage_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Type de document</label>
          <select
            className="input-field"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
          >
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={send}
              onChange={(e) => setSend(e.target.checked)}
            />
            Envoyer par email à l’artiste
          </label>
        </div>
        <div className="md:col-span-2">
          <Button
            onClick={generate}
            disabled={busy || !showId || !artistId}
          >
            {busy ? "Génération…" : "Générer le document"}
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}

      {preview ? (
        <div className="panel p-5">
          <h3 className="font-display text-lg font-semibold">Aperçu</h3>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">
            {preview.content}
          </pre>
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Documents récents</h3>
        {documents.length ? (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="panel flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">{DOC_TYPE_LABELS[doc.doc_type]}</p>
                <p className="text-sm text-muted">
                  {labelShow(doc.show_id)} · {labelArtist(doc.artist_id)} ·{" "}
                  {doc.doc_status} · {doc.generated_by}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPreview(doc)}>
                  Voir
                </Button>
                {doc.doc_status !== "sent" ? (
                  <Button variant="secondary" onClick={() => sendDoc(doc._id)}>
                    Envoyer
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="Aucun document pour l’instant"
            description="Génère un conducteur, un portrait, un contrat GUSO ou une fiche technique."
          />
        )}
      </section>
    </div>
  );
}
