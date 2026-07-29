"use client";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ARTIST_LEVEL_LABELS, DOC_TYPE_LABELS } from "@/lib/constants";
import type { Artist, DocumentRecord, Show } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ArtisteDetailPage() {
  const params = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/artists/${params.id}`);
      const json = await res.json();
      setArtist(json.artist ?? null);
      setShows(json.shows ?? []);
      setDocuments(json.documents ?? []);
    })();
  }, [params.id]);

  if (!artist) {
    return <p className="text-muted">Chargement de la fiche…</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/artistes" className="text-sm text-cyan hover:underline">
        ← Retour aux artistes
      </Link>

      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">{artist.stage_name}</h2>
            <p className="text-muted">{artist.legal_name}</p>
          </div>
          <span className="rounded-full bg-neon/20 px-3 py-1 text-sm text-neon">
            {ARTIST_LEVEL_LABELS[artist.artist_level]}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed">{artist.bio}</p>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p>Email · {artist.email || "—"}</p>
          <p>Tél · {artist.phone || "—"}</p>
          <p>Instagram · {artist.instagram_handle || "—"}</p>
          <p>TikTok · {artist.tiktok_handle || "—"}</p>
          <p>Cachet · {artist.default_fee_amount} €</p>
        </div>
        {artist.internal_notes ? (
          <p className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-muted">
            Notes · {artist.internal_notes}
          </p>
        ) : null}
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Soirées</h3>
        {shows.length ? (
          shows.map((show) => (
            <div key={show._id} className="panel flex items-center justify-between p-4">
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
          <p className="text-sm text-muted">Pas encore booké.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Documents</h3>
          <Button variant="secondary" onClick={() => (window.location.href = "/documents")}>
            Générer
          </Button>
        </div>
        {documents.length ? (
          documents.map((doc) => (
            <div key={doc._id} className="panel p-4 text-sm">
              <p className="font-medium">{DOC_TYPE_LABELS[doc.doc_type]}</p>
              <p className="text-muted">Statut · {doc.doc_status}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Aucun document pour l’instant.</p>
        )}
      </section>
    </div>
  );
}
