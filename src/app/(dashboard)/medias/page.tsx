"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BIIIP_REVIEW_TITLE_EN,
  BIIIP_REVIEW_TITLE_FR,
} from "@/lib/constants";
import type { MediaAsset, MediaType, Show, SiteStory } from "@/lib/types";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const emptyStory = {
  title_en: BIIIP_REVIEW_TITLE_EN,
  title_fr: BIIIP_REVIEW_TITLE_FR,
  body_text: "",
  photo_1: "",
  photo_2: "",
  photo_3: "",
  video_url: "",
  show_id: "",
};

export default function MediasPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [stories, setStories] = useState<SiteStory[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState({
    file_url: "",
    alt_text: "",
    caption: "",
    show_id: "",
    media_type: "photo" as MediaType,
    site_slug: "/galerie",
  });
  const [storyForm, setStoryForm] = useState(emptyStory);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [mediaRes, storyRes] = await Promise.all([
      fetch("/api/media-assets"),
      fetch("/api/site-stories"),
    ]);
    const mediaJson = await mediaRes.json();
    const storyJson = await storyRes.json();
    setAssets(mediaJson.media_assets ?? []);
    setShows(mediaJson.shows ?? storyJson.shows ?? []);
    setStories(storyJson.site_stories ?? []);
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

  async function createStory() {
    setBusy(true);
    setMessage("");
    const photo_urls = [
      storyForm.photo_1,
      storyForm.photo_2,
      storyForm.photo_3,
    ].filter((u) => u.trim());

    const res = await fetch("/api/site-stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title_en: storyForm.title_en,
        title_fr: storyForm.title_fr,
        body_text: storyForm.body_text,
        photo_urls,
        video_url: storyForm.video_url,
        show_id: storyForm.show_id || null,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error || "Impossible de créer la page");
      return;
    }
    setStoryForm(emptyStory);
    setMessage("Brouillon The Biiip Review créé ✅");
    await load();
  }

  async function publishStory(id: string) {
    setBusy(true);
    const res = await fetch(`/api/site-stories/${id}/publish`, {
      method: "POST",
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error || "Publication impossible");
      return;
    }
    setMessage(json.message || "Publié ✅");
    await load();
    if (json.public_path) {
      window.open(json.public_path, "_blank", "noopener,noreferrer");
    }
  }

  function openStory(story: SiteStory) {
    window.open(story.public_path, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-8">
      <section className="panel space-y-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold">
            The Biiip Review
          </h3>
          <p className="mt-1 text-sm text-muted">
            Formulaire pour le site{" "}
            <span className="text-cyan">biiipcomedyclub.fr</span> — 1 à 3
            photos, une vidéo, un texte. Titre EN :{" "}
            <strong className="text-white">{BIIIP_REVIEW_TITLE_EN}</strong>{" "}
            (FR : {BIIIP_REVIEW_TITLE_FR}).
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label-field">Title (English)</label>
            <input
              className="input-field"
              value={storyForm.title_en}
              onChange={(e) =>
                setStoryForm({ ...storyForm, title_en: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label-field">Titre FR (interne)</label>
            <input
              className="input-field"
              value={storyForm.title_fr}
              onChange={(e) =>
                setStoryForm({ ...storyForm, title_fr: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-field">Texte</label>
            <textarea
              className="input-field min-h-[120px]"
              value={storyForm.body_text}
              onChange={(e) =>
                setStoryForm({ ...storyForm, body_text: e.target.value })
              }
              placeholder="Récit de la soirée, ambiance, punchlines…"
            />
          </div>
          <div>
            <label className="label-field">Photo 1 (URL) *</label>
            <input
              className="input-field"
              value={storyForm.photo_1}
              onChange={(e) =>
                setStoryForm({ ...storyForm, photo_1: e.target.value })
              }
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="label-field">Photo 2 (URL)</label>
            <input
              className="input-field"
              value={storyForm.photo_2}
              onChange={(e) =>
                setStoryForm({ ...storyForm, photo_2: e.target.value })
              }
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="label-field">Photo 3 (URL)</label>
            <input
              className="input-field"
              value={storyForm.photo_3}
              onChange={(e) =>
                setStoryForm({ ...storyForm, photo_3: e.target.value })
              }
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="label-field">Vidéo (URL YouTube ou autre)</label>
            <input
              className="input-field"
              value={storyForm.video_url}
              onChange={(e) =>
                setStoryForm({ ...storyForm, video_url: e.target.value })
              }
              placeholder="https://youtube.com/…"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-field">Soirée liée (optionnel)</label>
            <select
              className="input-field"
              value={storyForm.show_id}
              onChange={(e) =>
                setStoryForm({ ...storyForm, show_id: e.target.value })
              }
            >
              <option value="">Aucune</option>
              {shows.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.show_date} · {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={() => void createStory()}
          disabled={
            busy || !storyForm.body_text.trim() || !storyForm.photo_1.trim()
          }
        >
          {busy ? "…" : "Créer la page"}
        </Button>
      </section>

      {stories.length ? (
        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold">
            Pages The Biiip Review
          </h3>
          {stories.map((story) => (
            <div
              key={story._id}
              className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{story.title_en}</p>
                <p className="text-xs text-muted">
                  {story.is_published ? "Publié" : "Brouillon"} ·{" "}
                  {story.photo_urls.length} photo
                  {story.photo_urls.length > 1 ? "s" : ""}
                  {story.video_url ? " · vidéo" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {story.is_published ? (
                  <Button
                    variant="secondary"
                    onClick={() => openStory(story)}
                  >
                    <ExternalLink size={14} /> Ouvrir
                  </Button>
                ) : (
                  <Button
                    onClick={() => void publishStory(story._id)}
                    disabled={busy}
                  >
                    Publier & ouvrir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold">
          Médias unitaires (galerie)
        </h3>
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
      </section>

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
          title="Aucun média unitaire"
          description="Ajoute une photo de soirée avec un alt_text propre pour le SEO."
        />
      )}
    </div>
  );
}
