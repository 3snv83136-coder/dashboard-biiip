"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MediaAsset, MediaType, Show } from "@/lib/types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export default function MediasPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState({
    file_url: "",
    alt_text: "",
    caption: "",
    show_id: "",
    media_type: "photo" as MediaType,
    site_slug: "/galerie",
  });
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/media-assets");
    const json = await res.json();
    setAssets(json.media_assets ?? []);
    setShows(json.shows ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAsset() {
    setMessage("");
    const res = await fetch("/api/media-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setMessage("Ça n'est pas passé. On réessaie ?");
      return;
    }
    setForm({
      file_url: "",
      alt_text: "",
      caption: "",
      show_id: "",
      media_type: "photo",
      site_slug: "/galerie",
    });
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
          <label className="label-field">URL du fichier</label>
          <input
            className="input-field"
            value={form.file_url}
            onChange={(e) => setForm({ ...form, file_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="label-field">Texte alternatif (SEO)</label>
          <input
            className="input-field"
            value={form.alt_text}
            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Légende</label>
          <input
            className="input-field"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
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
        <div>
          <label className="label-field">Type</label>
          <select
            className="input-field"
            value={form.media_type}
            onChange={(e) =>
              setForm({ ...form, media_type: e.target.value as MediaType })
            }
          >
            <option value="photo">Photo</option>
            <option value="video">Vidéo</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Button onClick={createAsset} disabled={!form.file_url}>
            Ajouter le média
          </Button>
        </div>
      </div>

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
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    Vidéo · {asset.file_url}
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="font-medium">{asset.caption || asset.alt_text}</p>
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
          description="Ajoute une photo de soirée avec un alt_text propre pour le SEO."
        />
      )}
    </div>
  );
}
