"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MediaAsset, MediaType, Show } from "@/lib/types";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const emptyForm = {
  file_url: "",
  media_type: "photo" as MediaType,
  title: "",
  caption: "",
  show_id: "",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediasPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/media-assets");
    const json = await res.json();
    setAssets(json.media_assets ?? []);
    setShows(json.shows ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({
      ...f,
      file_url: dataUrl,
      media_type: file.type.startsWith("video/") ? "video" : "photo",
    }));
    setFileName(file.name);
  }

  async function createAsset() {
    setError("");
    setMessage("");
    if (!form.file_url) {
      setError("Choisis une photo ou une vidéo.");
      return;
    }
    if (!form.title.trim()) {
      setError("Mets un titre.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/media-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, site_slug: "/galerie" }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Ça n'est pas passé. On réessaie ?");
      return;
    }
    setForm(emptyForm);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage("Média ajouté ✅");
    await load();
  }

  async function publish(id: string) {
    const res = await fetch(`/api/media-assets/${id}/publish`, {
      method: "POST",
    });
    const json = await res.json();
    setMessage(json.message || "Publié ✅");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="panel grid gap-3 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label-field">Photo ou vidéo</label>
          <label className="input-field flex cursor-pointer items-center gap-2 text-muted">
            <Upload size={16} />
            {fileName || "Choisir un fichier…"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>
        <div>
          <label className="label-field">Titre</label>
          <input
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Plateau Biiip — samedi"
          />
        </div>
        <div>
          <label className="label-field">Soirée</label>
          <select
            className="input-field"
            value={form.show_id}
            onChange={(e) => setForm({ ...form, show_id: e.target.value })}
          >
            <option value="">Aucune</option>
            {shows.map((s) => (
              <option key={s._id} value={s._id}>
                {s.show_date} · {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Texte</label>
          <textarea
            className="input-field min-h-[80px]"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            placeholder="Quelques mots sur la photo ou la vidéo…"
          />
        </div>
        <div className="md:col-span-2">
          <Button onClick={createAsset} disabled={saving}>
            {saving ? "Ajout…" : "Ajouter le média"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      {assets.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset._id} className="panel overflow-hidden">
              <div className="relative aspect-video bg-black/30">
                {asset.media_type === "photo" && asset.file_url ? (
                  <Image
                    src={asset.file_url}
                    alt={asset.alt_text || "Média Biiip"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : asset.media_type === "video" && asset.file_url ? (
                  <video
                    src={asset.file_url}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    Vidéo
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="font-medium">{asset.title || asset.caption}</p>
                {asset.caption ? (
                  <p className="text-sm text-muted">{asset.caption}</p>
                ) : null}
                <p className="text-xs text-muted">
                  {asset.is_published ? "Publié" : "Brouillon"} ·{" "}
                  {asset.site_slug}
                </p>
                {!asset.is_published ? (
                  <Button
                    variant="secondary"
                    onClick={() => publish(asset._id)}
                  >
                    Publier sur le site
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun média"
          description="Ajoute une photo ou une vidéo de soirée avec un titre pour le SEO."
        />
      )}
    </div>
  );
}
