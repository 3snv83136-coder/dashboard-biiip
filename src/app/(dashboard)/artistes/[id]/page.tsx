"use client";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ARTIST_LEVEL_LABELS, DOC_TYPE_LABELS } from "@/lib/constants";
import type { Artist, DocumentRecord, Show } from "@/lib/types";
import { Copy, KeyRound, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ArtisteDetailPage() {
  const params = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [portalUrl, setPortalUrl] = useState("");
  const [accessMsg, setAccessMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/artists/${params.id}`);
    const json = await res.json();
    setArtist(json.artist ?? null);
    setShows(json.shows ?? []);
    setDocuments(json.documents ?? []);
  }, [params.id]);

  useEffect(() => {
    void load();
    setPortalUrl(`${window.location.origin}/ma-fiche`);
  }, [load]);

  async function accessAction(action: string) {
    setBusy(true);
    setAccessMsg("");
    const res = await fetch(`/api/artists/${params.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setAccessMsg(json.error || "Échec");
      return;
    }
    if (json.artist) setArtist(json.artist);
    else await load();
    if (json.portal_url) setPortalUrl(json.portal_url);
    setAccessMsg(json.message || "OK");
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setAccessMsg("Copié ✅");
  }

  if (!artist) {
    return <p className="text-muted">Chargement de la fiche…</p>;
  }

  const shareText = artist.access_code
    ? `${portalUrl}\nCode : ${artist.access_code}`
    : "";

  return (
    <div className="space-y-6">
      <Link href="/artistes" className="text-sm text-cyan hover:underline">
        ← Retour aux artistes
      </Link>

      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-4">
            {artist.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.photo_url}
                alt={artist.stage_name}
                className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : null}
            <div>
              <h2 className="font-display text-2xl font-bold">
                {artist.stage_name}
              </h2>
              <p className="text-muted">{artist.legal_name}</p>
            </div>
          </div>
          <span className="rounded-full bg-neon/20 px-3 py-1 text-sm text-neon">
            {ARTIST_LEVEL_LABELS[artist.artist_level]}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed">{artist.bio}</p>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p>Email · {artist.email || "—"}</p>
          <p>Tél · {artist.phone || "—"}</p>
          <p>Ville · {artist.city || "—"}</p>
          <p>Instagram · {artist.instagram_handle || "—"}</p>
          <p>TikTok · {artist.tiktok_handle || "—"}</p>
          <p>Cachet · {artist.default_fee_amount} €</p>
          <p>Tech · {artist.technical_needs || "—"}</p>
          <p>Repas · {artist.dietary_notes || "—"}</p>
        </div>
        {artist.internal_notes ? (
          <p className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-muted">
            Notes · {artist.internal_notes}
          </p>
        ) : null}
      </div>

      <div className="panel space-y-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold">
            Accès fiche artiste
          </h3>
          <p className="mt-1 text-sm text-muted">
            Lien à envoyer à la main (WhatsApp…) ou via SMS / email depuis ici.
          </p>
        </div>

        <div className="rounded-xl bg-black/25 p-3 text-sm">
          <p>
            Lien · <span className="text-cyan">{portalUrl}</span>
          </p>
          <p className="mt-1">
            Code ·{" "}
            <span className="font-mono text-lg tracking-wider text-[#f5d76e]">
              {artist.access_code || "pas encore généré"}
            </span>
          </p>
          {artist.access_profile_completed_at ? (
            <p className="mt-1 text-xs text-success">
              Fiche complétée par l’artiste · {artist.access_profile_completed_at}
            </p>
          ) : (
            <p className="mt-1 text-xs text-warn">Fiche pas encore soumise</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              void accessAction(artist.access_code ? "reset" : "generate")
            }
            disabled={busy}
          >
            <KeyRound size={16} />
            {artist.access_code ? "Nouveau" : "Créer le code"}
          </Button>
          <Button
            variant="secondary"
            disabled={!shareText}
            onClick={() => void copyText(shareText)}
          >
            <Copy size={16} /> Copier
          </Button>
          <Button
            variant="ghost"
            disabled={busy || !artist.access_code}
            onClick={() => void accessAction("send_sms")}
          >
            <MessageSquare size={16} /> SMS
          </Button>
          <Button
            variant="ghost"
            disabled={busy || !artist.access_code}
            onClick={() => void accessAction("send_email")}
          >
            <Mail size={16} /> Email
          </Button>
        </div>
        {accessMsg ? (
          <p className="text-sm text-success">{accessMsg}</p>
        ) : null}
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Soirées</h3>
        {shows.length ? (
          shows.map((show) => (
            <div
              key={show._id}
              className="panel flex items-center justify-between p-4"
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
          <p className="text-sm text-muted">Pas encore booké.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Documents</h3>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/documents")}
          >
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
