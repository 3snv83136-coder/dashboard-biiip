"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ARTIST_LEVEL_LABELS } from "@/lib/constants";
import type { Artist, ArtistLevel } from "@/lib/types";
import { ClipboardPaste, ImagePlus, Plus, Search } from "lucide-react";
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
  const [ocrBusy, setOcrBusy] = useState(false);
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
        a.email.toLowerCase().includes(query) ||
        (a.city || "").toLowerCase().includes(query) ||
        (a.address_line || "").toLowerCase().includes(query)
    );
  }, [artists, q]);

  const previewCount = useMemo(() => {
    const t = importText.trim();
    if (!t) return 0;
    if (t.includes("\n\n")) return t.split(/\n\s*\n+/).filter((b) => b.trim()).length;
    return t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;
  }, [importText]);

  async function createArtist() {
    setSaving(true);
    const res = await fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return;
    setOpen(false);
    setForm(empty);
    await load();
  }

  async function importContacts() {
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
    if ((json.created?.length ?? 0) + (json.updated?.length ?? 0) > 0) {
      setTimeout(() => setImportOpen(false), 1200);
    }
  }

  async function ocrFromFile(file: File) {
    setOcrBusy(true);
    setImportMessage("Lecture de la capture…");
    try {
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, "fra+eng");
      const text = (data.text || "").trim();
      if (!text) {
        setImportMessage("Aucun texte lu sur l’image. Réessaie avec une capture plus nette.");
        return;
      }
      setImportText((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
      setImportMessage("Texte extrait de la photo — vérifie puis importe.");
    } catch (err) {
      console.error("[ocr]", err);
      setImportMessage("OCR impossible. Colle le texte à la main (Live Text iPhone → Copier).");
    } finally {
      setOcrBusy(false);
    }
  }

  function onPasteImport(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) void ocrFromFile(file);
        return;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="toolbar-row">
        <div className="relative min-w-0 flex-1">
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setImportOpen(true)}
          >
            <ClipboardPaste size={16} /> Coller SMS / photo
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus size={16} /> Ajouter un artiste
          </Button>
        </div>
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
              <p className="mt-2 text-xs text-muted">
                {[artist.address_line, [artist.postal_code, artist.city].filter(Boolean).join(" ")]
                  .filter(Boolean)
                  .join(" · ") || "Pas d’adresse"}
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
          description="Ajoute un artiste, ou colle un SMS / une capture d’écran."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Coller SMS / photo
            </Button>
            <Button onClick={() => setOpen(true)}>Ajouter un artiste</Button>
          </div>
        </EmptyState>
      )}

      {importOpen ? (
        <div className="modal-sheet">
          <div className="modal-panel max-w-xl">
            <h3 className="font-display text-lg font-semibold">
              Coller SMS / capture
            </h3>
            <p className="mt-2 text-sm text-muted">
              Colle du texte (SMS, WhatsApp) ou une <b>photo</b> (Ctrl/Cmd+V /
              bouton ci-dessous). Sépare chaque artiste par une ligne vide.
              Exemple :
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-muted">
{`Léo Mirage
06 01 02 03 04
12 rue de l'Humilité
83000 Toulon

Sara Volt
sara@mail.fr
5 avenue de la République
13001 Marseille`}
            </pre>
            <div className="mt-4">
              <label className="label-field">Texte collé / OCR</label>
              <textarea
                className="input-field min-h-[220px] font-mono text-xs"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                onPaste={onPasteImport}
                placeholder="Colle ici… (tu peux aussi coller une image)"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                  <ImagePlus size={16} />
                  {ocrBusy ? "Lecture…" : "Ajouter une photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={ocrBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void ocrFromFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <p className="text-xs text-muted">
                  {previewCount} fiche{previewCount > 1 ? "s" : ""} détectée
                  {previewCount > 1 ? "s" : ""}
                </p>
              </div>
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
                onClick={() => void importContacts()}
                disabled={saving || ocrBusy || !importText.trim()}
              >
                {saving ? "Import…" : "Importer / mettre à jour"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="modal-sheet">
          <div className="modal-panel">
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
                onClick={() => void createArtist()}
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
