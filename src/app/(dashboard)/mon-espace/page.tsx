"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOC_TYPE_LABELS } from "@/lib/constants";
import type { DocumentRecord, Show } from "@/lib/types";
import { useEffect, useState } from "react";

export default function MonEspacePage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [preview, setPreview] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    void (async () => {
      const [showsRes, docsRes] = await Promise.all([
        fetch("/api/shows"),
        fetch("/api/documents"),
      ]);
      const showsJson = await showsRes.json();
      const docsJson = await docsRes.json();
      setShows(showsJson.shows ?? []);
      setDocuments(docsJson.documents ?? []);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Mes soirées</h2>
        {shows.length ? (
          shows.map((show) => (
            <div
              key={show._id}
              className="panel flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">{show.title}</p>
                <p className="text-sm text-muted">
                  {show.show_date} · {show.start_time}
                </p>
              </div>
              <StatusBadge status={show.booking_status} />
            </div>
          ))
        ) : (
          <EmptyState
            title="Pas de soirée pour toi pour l’instant"
            description="Dès qu’on te booke, ça apparaît ici."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Mes documents</h2>
        {documents.length ? (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="panel flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">{DOC_TYPE_LABELS[doc.doc_type]}</p>
                <p className="text-sm text-muted">Statut · {doc.doc_status}</p>
              </div>
              <button
                className="text-sm text-cyan hover:underline"
                onClick={() => setPreview(doc)}
              >
                Ouvrir
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Aucun document disponible.</p>
        )}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center">
          <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
            <h3 className="font-display text-lg font-semibold">
              {DOC_TYPE_LABELS[preview.doc_type]}
            </h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-muted">
              {preview.content}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                className="text-sm text-cyan"
                onClick={() => setPreview(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
