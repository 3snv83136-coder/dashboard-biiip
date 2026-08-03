"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Artist } from "@/lib/types";
import { Copy, KeyRound, Mail, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const HERO =
  "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=1200&q=80";

export default function FichesArtistesPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [portalUrl, setPortalUrl] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/artists");
    const json = await res.json();
    setArtists(json.artists ?? []);
  }, []);

  useEffect(() => {
    void load();
    setPortalUrl(`${window.location.origin}/ma-fiche`);
  }, [load]);

  async function accessAction(artistId: string, action: string) {
    setBusyId(artistId);
    setMessage("");
    const res = await fetch(`/api/artists/${artistId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setMessage(json.error || "Échec");
      return;
    }
    if (json.portal_url) setPortalUrl(json.portal_url);
    if (json.access_code) {
      setMessage(`Code : ${json.access_code}`);
    } else {
      setMessage(json.message || "OK");
    }
    await load();
  }

  async function copyShare(artist: Artist) {
    if (!artist.access_code) return;
    const text = `${portalUrl}\nCode : ${artist.access_code}`;
    await navigator.clipboard.writeText(text);
    setMessage(`Copié pour ${artist.stage_name} ✅`);
  }

  return (
    <div className="space-y-6">
      <div className="panel relative overflow-hidden">
        <div className="relative h-36 w-full sm:h-44">
          <Image
            src={HERO}
            alt="Fiches artistes"
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-5">
            <h3 className="font-display text-xl font-semibold text-white">
              Codes d’accès fiches
            </h3>
            <p className="text-sm text-white/75">
              1) Créer le code · 2) Copier · 3) Envoyer à l’artiste
            </p>
          </div>
        </div>
        <div className="space-y-2 p-5 pt-3">
          <p className="text-xs text-muted">
            Lien artiste :{" "}
            <a className="text-cyan" href={portalUrl || "/ma-fiche"}>
              {portalUrl || "/ma-fiche"}
            </a>
          </p>
          {message ? <p className="text-sm text-success">{message}</p> : null}
        </div>
      </div>

      {artists.length ? (
        <div className="space-y-3">
          {artists.map((artist) => {
            const busy = busyId === artist._id;
            return (
              <div
                key={artist._id}
                className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {artist.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.photo_url}
                      alt={artist.stage_name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={HERO}
                        alt=""
                        fill
                        className="object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/artistes/${artist._id}`}
                      className="font-medium hover:text-cyan"
                    >
                      {artist.stage_name}
                    </Link>
                    <p className="mt-1 font-mono text-2xl tracking-[0.2em] text-white">
                      {artist.access_code || "····"}
                    </p>
                    <p className="text-xs text-muted">
                      {artist.access_profile_completed_at
                        ? "Fiche remplie"
                        : "Pas encore remplie"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void accessAction(
                        artist._id,
                        artist.access_code ? "reset" : "generate"
                      )
                    }
                  >
                    <KeyRound size={16} />
                    {artist.access_code ? "Nouveau" : "Créer le code"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!artist.access_code}
                    onClick={() => void copyShare(artist)}
                  >
                    <Copy size={16} /> Copier
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy || !artist.access_code}
                    onClick={() => void accessAction(artist._id, "send_sms")}
                  >
                    <MessageSquare size={16} /> SMS
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy || !artist.access_code}
                    onClick={() => void accessAction(artist._id, "send_email")}
                  >
                    <Mail size={16} /> Email
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Aucun artiste"
          description="Crée d’abord un artiste, puis reviens ici."
        >
          <Link href="/artistes">
            <Button>Artistes</Button>
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
