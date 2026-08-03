"use client";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ARTIST_LEVEL_LABELS, DOC_TYPE_LABELS } from "@/lib/constants";
import type { Artist, ArtistLevel, DocumentRecord, Show } from "@/lib/types";
import { Copy, KeyRound, Mail, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type EditForm = {
  stage_name: string;
  legal_name: string;
  email: string;
  phone: string;
  bio: string;
  photo_url: string;
  artist_level: ArtistLevel;
  default_fee_amount: string;
  instagram_handle: string;
  tiktok_handle: string;
  city: string;
  technical_needs: string;
  dietary_notes: string;
  internal_notes: string;
};

function toForm(artist: Artist): EditForm {
  return {
    stage_name: artist.stage_name,
    legal_name: artist.legal_name,
    email: artist.email,
    phone: artist.phone,
    bio: artist.bio,
    photo_url: artist.photo_url,
    artist_level: artist.artist_level,
    default_fee_amount: String(artist.default_fee_amount ?? 0),
    instagram_handle: artist.instagram_handle,
    tiktok_handle: artist.tiktok_handle,
    city: artist.city,
    technical_needs: artist.technical_needs,
    dietary_notes: artist.dietary_notes,
    internal_notes: artist.internal_notes,
  };
}

export default function ArtisteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [portalUrl, setPortalUrl] = useState("");
  const [accessMsg, setAccessMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saveMsg, setSaveMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/artists/${params.id}`);
    const json = await res.json();
    setArtist(json.artist ?? null);
    setShows(json.shows ?? []);
    setDocuments(json.documents ?? []);
    if (json.artist) setForm(toForm(json.artist));
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
    if (json.artist) {
      setArtist(json.artist);
      setForm(toForm(json.artist));
    } else await load();
    if (json.portal_url) setPortalUrl(json.portal_url);
    setAccessMsg(json.message || "OK");
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setAccessMsg("Copié ✅");
  }

  async function saveEdit() {
    if (!form) return;
    setBusy(true);
    setSaveMsg("");
    const res = await fetch(`/api/artists/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        default_fee_amount: Number(form.default_fee_amount) || 0,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setSaveMsg(json.error || "Impossible d’enregistrer");
      return;
    }
    setArtist(json.artist);
    setForm(toForm(json.artist));
    setEditing(false);
    setSaveMsg("Fiche mise à jour ✅");
  }

  async function deleteArtist() {
    if (
      !confirm(
        `Supprimer définitivement ${artist?.stage_name} ? Les bookings et documents liés seront aussi retirés.`
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/artists/${params.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json();
      setSaveMsg(json.error || "Suppression impossible");
      return;
    }
    router.push("/artistes");
  }

  if (!artist || !form) {
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neon/20 px-3 py-1 text-sm text-neon">
              {ARTIST_LEVEL_LABELS[artist.artist_level]}
            </span>
            {!editing ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setForm(toForm(artist));
                  setEditing(true);
                  setSaveMsg("");
                }}
              >
                <Pencil size={16} /> Modifier
              </Button>
            ) : null}
            {isAdmin ? (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => void deleteArtist()}
              >
                <Trash2 size={16} /> Supprimer
              </Button>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(
              [
                ["stage_name", "Nom de scène"],
                ["legal_name", "Nom civil"],
                ["email", "Email"],
                ["phone", "Téléphone"],
                ["city", "Ville"],
                ["photo_url", "Photo (URL)"],
                ["instagram_handle", "Instagram"],
                ["tiktok_handle", "TikTok"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="label-field">{label}</label>
                <input
                  className="input-field"
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <label className="label-field">Niveau</label>
              <select
                className="input-field"
                value={form.artist_level}
                onChange={(e) =>
                  setForm({
                    ...form,
                    artist_level: e.target.value as ArtistLevel,
                  })
                }
              >
                {(Object.keys(ARTIST_LEVEL_LABELS) as ArtistLevel[]).map(
                  (level) => (
                    <option key={level} value={level}>
                      {ARTIST_LEVEL_LABELS[level]}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="label-field">Cachet (€)</label>
              <input
                className="input-field"
                type="number"
                value={form.default_fee_amount}
                onChange={(e) =>
                  setForm({ ...form, default_fee_amount: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Bio</label>
              <textarea
                className="input-field min-h-[100px]"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Besoins techniques</label>
              <textarea
                className="input-field min-h-[70px]"
                value={form.technical_needs}
                onChange={(e) =>
                  setForm({ ...form, technical_needs: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Notes repas</label>
              <textarea
                className="input-field min-h-[70px]"
                value={form.dietary_notes}
                onChange={(e) =>
                  setForm({ ...form, dietary_notes: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Notes internes</label>
              <textarea
                className="input-field min-h-[70px]"
                value={form.internal_notes}
                onChange={(e) =>
                  setForm({ ...form, internal_notes: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void saveEdit()}>
                Enregistrer
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setForm(toForm(artist));
                  setEditing(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
        {saveMsg ? (
          <p className="mt-3 text-sm text-success">{saveMsg}</p>
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
