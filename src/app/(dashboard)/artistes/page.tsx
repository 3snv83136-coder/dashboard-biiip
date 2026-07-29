"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ARTIST_LEVEL_LABELS } from "@/lib/constants";
import type { Artist, ArtistLevel } from "@/lib/types";
import { ClipboardPaste, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const empty = {
  stage_name: "",
  legal_name: "",
  email: "",
  phone: "",
  bio: "",
  artist_level: "jeune_talent" as ArtistLevel,
  default_fee_amount: 150,
  instagram_handle: "",
  tiktok_handle: "",
  internal_notes: "",
};

export default function ArtistesPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/artists");
    const json = await res.json();
    setArtists(json.artists ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return artists.filter(
      (a) =>
        a.stage_name.toLowerCase().includes(query) ||
        a.legal_name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query)
    );
  }, [artists, q]);

  const previewCount = useMemo(
    () =>
      importText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean).length,
    [importText]
  );

  async function createArtist() {
    setSaving(true);
    await fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setOpen(false);
    setForm(empty);
    await load();
  }

  async function importWhatsApp() {
    setSaving(true);
    setImportMessage("");
    const res = await fetch("/api/artists/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: importText }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setImportMessage(json.error || "Ça n'est pas passé. On réessaie ?");
      return;
    }
    setImportMessage(json.message);
    setImportText("");
    await load();
    if ((json.created?.length ?? 0) > 0) {
      setTimeout(() => setImportOpen(false), 900);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className="input-field pl-9"
            placeholder="Chercher un artiste…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setImportOpen(true)}>
          <ClipboardPaste size={16} /> Import WhatsApp
        </Button>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Ajouter un artiste
        </Button>
      </div>

      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((artist) => (
            <Link
              key={artist._id}
              href={`/artistes/${artist._id}`}
              className="panel block p-4 transition hover:border-cyan/40 hover:shadow-cyan"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    {artist.stage_name}
                  </h3>
                  <p className="text-sm text-muted">{artist.legal_name}</p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {ARTIST_LEVEL_LABELS[artist.artist_level]}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted">
                {artist.bio || "Pas encore de bio."}
              </p>
              <p className="mt-3 text-sm text-cyan">
                Cachet habituel · {artist.default_fee_amount} €
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun artiste dans le répertoire"
          description="Ajoute un artiste, ou colle une liste WhatsApp."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import WhatsApp
            </Button>
            <Button onClick={() => setOpen(true)}>Ajouter un artiste</Button>
          </div>
        </EmptyState>
      )}

      {importOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center">
          <div className="panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
            <h3 className="font-display text-lg font-semibold">
              Import WhatsApp
            </h3>
            <p className="mt-2 text-sm text-muted">
              Ouvre ton groupe → Infos → Participants, copie les noms, et colle
              ici (un nom par ligne). Les doublons sont ignorés.
            </p>
            <div className="mt-4">
              <label className="label-field">Liste collée</label>
              <textarea
                className="input-field min-h-[200px] font-mono text-xs"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Léo Mirage\nSara Volt\nMax Riff +33601020304"}
              />
              <p className="mt-1 text-xs text-muted">
                {previewCount} ligne{previewCount > 1 ? "s" : ""} détectée
                {previewCount > 1 ? "s" : ""}
              </p>
            </div>
            {importMessage ? (
              <p className="mt-3 text-sm text-success">{importMessage}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setImportOpen(false);
                  setImportMessage("");
                }}
              >
                Fermer
              </Button>
              <Button
                onClick={importWhatsApp}
                disabled={saving || !importText.trim()}
              >
                {saving ? "Import…" : "Importer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center">
          <div className="panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
            <h3 className="font-display text-lg font-semibold">Nouvel artiste</h3>
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
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
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
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={createArtist}
                disabled={saving || !form.stage_name}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
