"use client";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ARTIST_LEVEL_LABELS, DOC_TYPE_LABELS } from "@/lib/constants";
import type { Artist, ArtistLevel, DocumentRecord, Show } from "@/lib/types";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ArtistForm = Pick<
  Artist,
  | "stage_name"
  | "legal_name"
  | "email"
  | "phone"
  | "bio"
  | "artist_level"
  | "default_fee_amount"
  | "instagram_handle"
  | "tiktok_handle"
  | "internal_notes"
>;

function toForm(artist: Artist): ArtistForm {
  return {
    stage_name: artist.stage_name,
    legal_name: artist.legal_name,
    email: artist.email,
    phone: artist.phone,
    bio: artist.bio,
    artist_level: artist.artist_level,
    default_fee_amount: artist.default_fee_amount,
    instagram_handle: artist.instagram_handle,
    tiktok_handle: artist.tiktok_handle,
    internal_notes: artist.internal_notes,
  };
}

export default function ArtisteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canEdit = role === "admin" || role === "staff";
  const canDelete = role === "admin";

  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ArtistForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/artists/${params.id}`);
    const json = await res.json();
    setArtist(json.artist ?? null);
    setShows(json.shows ?? []);
    setDocuments(json.documents ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function startEdit() {
    if (!artist) return;
    setForm(toForm(artist));
    setMessage("");
    setEditing(true);
  }

  async function saveEdit() {
    if (!form) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/artists/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Ça n'est pas passé. On réessaie ?");
      return;
    }
    setEditing(false);
    await load();
  }

  async function deleteArtist() {
    if (!artist) return;
    const ok = window.confirm(
      `Supprimer définitivement la fiche de ${artist.stage_name} ? Ses soirées et documents liés seront aussi retirés.`
    );
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/artists/${params.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setMessage("La suppression a échoué. On réessaie ?");
      return;
    }
    router.push("/artistes");
  }

  if (!artist) {
    return <p className="text-muted">Chargement de la fiche…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/artistes" className="text-sm text-cyan hover:underline">
          ← Retour aux artistes
        </Link>
        {canEdit ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={startEdit}>
              Modifier
            </Button>
            {canDelete ? (
              <Button variant="danger" onClick={deleteArtist} disabled={deleting}>
                {deleting ? "Suppression…" : "Supprimer"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {message ? <p className="text-sm text-red-300">{message}</p> : null}

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

      {editing && form ? (
        <div className="modal-sheet">
          <div className="modal-panel">
            <h3 className="font-display text-lg font-semibold">
              Modifier {artist.stage_name}
            </h3>
            <div className="mt-4 grid gap-3">
              {(
                [
                  ["stage_name", "Nom de scène"],
                  ["legal_name", "Nom civil"],
                  ["email", "Email"],
                  ["phone", "Téléphone"],
                  ["instagram_handle", "Instagram"],
                  ["tiktok_handle", "TikTok"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="label-field">{label}</label>
                  <input
                    className="input-field"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
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
                    {Object.entries(ARTIST_LEVEL_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">Cachet (€)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.default_fee_amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        default_fee_amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Bio</label>
                <textarea
                  className="input-field min-h-[80px]"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">Notes internes</label>
                <textarea
                  className="input-field min-h-[60px]"
                  value={form.internal_notes}
                  onChange={(e) =>
                    setForm({ ...form, internal_notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Annuler
              </Button>
              <Button onClick={saveEdit} disabled={saving || !form.stage_name}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
