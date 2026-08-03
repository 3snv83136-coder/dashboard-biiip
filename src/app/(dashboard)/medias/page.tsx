"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BIIIP_REVIEW_TITLE_EN,
  BIIIP_REVIEW_TITLE_FR,
} from "@/lib/constants";
import { fileToJpegFile } from "@/lib/image-resize";
import type { MediaAsset, Show, SiteStory, SiteStoryFaq } from "@/lib/types";
import { ExternalLink, Sparkles, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type StoryForm = {
  title_en: string;
  title_fr: string;
  h1: string;
  slug: string;
  meta_description: string;
  body_text: string;
  notes: string;
  photo_1: string;
  video_url: string;
  show_id: string;
  faqs: SiteStoryFaq[];
  author_name: string;
  about_org: string;
  generated_by: "claude" | "manual";
};

const emptyForm = (): StoryForm => ({
  title_en: BIIIP_REVIEW_TITLE_EN,
  title_fr: BIIIP_REVIEW_TITLE_FR,
  h1: "",
  slug: "",
  meta_description: "",
  body_text: "",
  notes: "",
  photo_1: "",
  video_url: "",
  show_id: "",
  faqs: [],
  author_name: "Rédaction Biiip Comedy Club",
  about_org:
    "Le Biiip Comedy Club est une cave voûtée de 19 places à Toulon.",
  generated_by: "manual",
});

async function readApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text.slice(0, 180) || `Erreur HTTP ${res.status}` };
  }
}

function isTimeoutError(message: string, status?: number): boolean {
  if (status === 504 || status === 408) return true;
  return /FUNCTION_INVOCATION_TIMEOUT|timeout|délai|timed out/i.test(message);
}

/** Brouillon client si l’API Vercel est tuée avant la réponse. */
function clientLocalDraft(notes: string, show?: Show | null): StoryForm {
  const theme =
    notes.trim() || show?.title || "une soirée stand-up pleine d'énergie";
  const h1 = show
    ? `${show.title} — vu du Biiip Comedy Club`
    : `Au Biiip : ${theme.slice(0, 48)}`;
  return {
    ...emptyForm(),
    h1,
    slug: "",
    meta_description:
      "L'avis du Biiip Comedy Club à Toulon — cave voûtée, 19 places, stand-up live.",
    body_text: [
      `Au Biiip Comedy Club à Toulon, la cave voûtée n'accueille que 19 places — assez près pour sentir chaque punchline arriver.`,
      notes.trim()
        ? `À partir des notes de l'équipe — « ${notes.trim()} » — l'ambiance est celle d'une salle collée à la scène, des rires qui rebondissent sous la voûte.`
        : `Une soirée stand-up intimiste, des sets serrés, des réactions vraies.`,
      `Des sets serrés, des réactions vraies, et une intimité que les grandes salles ne peuvent pas inventer.`,
    ].join("\n\n"),
    notes,
    show_id: show?._id || "",
    faqs: [
      {
        question: "Où se trouve le Biiip Comedy Club ?",
        answer:
          "À Toulon — une cave voûtée intimiste avec une scène de 19 places.",
      },
      {
        question: "C'est quoi L'avis du Biiip ?",
        answer:
          "Notre regard éditorial sur une soirée au club : ambiance, artistes, et ce qui a fait rire la salle.",
      },
      {
        question: "Comment réserver des places ?",
        answer:
          "La billetterie est sur Billetweb via biiipcomedyclub.fr.",
      },
    ],
    generated_by: "manual",
  };
}

export default function MediasPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [stories, setStories] = useState<SiteStory[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState<StoryForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mediaRes, storyRes] = await Promise.all([
        fetch("/api/media-assets"),
        fetch("/api/site-stories"),
      ]);
      const mediaJson = await readApiJson(mediaRes);
      const storyJson = await readApiJson(storyRes);
      setAssets((mediaJson.media_assets as MediaAsset[]) ?? []);
      setShows(
        ((mediaJson.shows as Show[]) ?? (storyJson.shows as Show[]) ?? [])
      );
      setStories((storyJson.site_stories as SiteStory[]) ?? []);
    } catch {
      setError("Impossible de charger les médias");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadToServer(file: File): Promise<{
    url: string;
    media_type: "photo" | "video";
  }> {
    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|mov|webm|m4v)$/i.test(file.name);

    let toSend = file;
    if (!isVideo) {
      try {
        toSend = await fileToJpegFile(file, 1200, 0.78);
      } catch {
        // HEIC / format non décodable ici → on envoie le fichier brut
        if (file.size > 4 * 1024 * 1024) {
          throw new Error(
            "Photo trop lourde (max 4 Mo). Réessaie en JPG, ou compresse-la."
          );
        }
        toSend = file;
      }
    } else if (file.size > 4 * 1024 * 1024) {
      throw new Error(
        "Vidéo trop lourde (max 4 Mo). Utilise plutôt une URL YouTube."
      );
    }

    const body = new FormData();
    body.append("file", toSend, toSend.name || file.name || "media.jpg");

    const res = await fetch("/api/uploads", { method: "POST", body });
    const json = await readApiJson(res);
    if (!res.ok || !json.url) {
      throw new Error(
        String(json.error || `Upload échoué (${res.status})`)
      );
    }
    return {
      url: String(json.url),
      media_type:
        json.media_type === "video" || isVideo ? "video" : "photo",
    };
  }

  async function onMediaFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const result = await uploadToServer(file);
      if (result.media_type === "video") {
        setForm((prev) => ({ ...prev, video_url: result.url }));
        setMessage("Vidéo uploadée ✅");
      } else {
        setForm((prev) => ({ ...prev, photo_1: result.url }));
        setMessage("Photo uploadée ✅");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  }

  async function generateAi(): Promise<StoryForm | null> {
    const notes = form.notes || form.body_text;
    const linkedShow =
      shows.find((s) => s._id === form.show_id) ?? null;

    let res: Response;
    try {
      res = await fetch("/api/site-stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          show_id: form.show_id || null,
          has_photo: Boolean(form.photo_1.trim()),
          has_video: Boolean(form.video_url.trim()),
          video_url: form.video_url,
        }),
      });
    } catch {
      const next = {
        ...clientLocalDraft(notes, linkedShow),
        photo_1: form.photo_1,
        video_url: form.video_url,
        notes: form.notes,
        show_id: form.show_id,
      };
      setForm(next);
      setMessage(
        "Délai réseau — brouillon local prêt. Tu peux créer l’aperçu."
      );
      return next;
    }

    const json = await readApiJson(res);
    const draft = json.draft as Partial<StoryForm> | undefined;
    const errText = String(json.error || "");

    if (!res.ok || !draft?.body_text || !draft?.h1) {
      if (isTimeoutError(errText, res.status) || !draft?.body_text) {
        const next = {
          ...clientLocalDraft(notes, linkedShow),
          photo_1: form.photo_1,
          video_url: form.video_url,
          notes: form.notes,
          show_id: form.show_id,
        };
        setForm(next);
        setMessage(
          "Serveur trop lent (limite Vercel) — brouillon local prêt. Tu peux créer l’aperçu."
        );
        return next;
      }
      throw new Error(errText || "Génération IA impossible");
    }

    const next: StoryForm = {
      ...form,
      title_en: String(draft.title_en || form.title_en),
      title_fr: String(draft.title_fr || form.title_fr),
      h1: String(draft.h1),
      slug: String(draft.slug || form.slug),
      meta_description: String(
        draft.meta_description || form.meta_description
      ),
      body_text: String(draft.body_text),
      faqs: Array.isArray(draft.faqs) && draft.faqs.length
        ? (draft.faqs as SiteStoryFaq[])
        : form.faqs,
      author_name: String(draft.author_name || form.author_name),
      about_org: String(draft.about_org || form.about_org),
      generated_by: draft.generated_by === "claude" ? "claude" : "manual",
    };
    setForm(next);
    if (json.warning) {
      setMessage(String(json.warning));
    }
    return next;
  }

  async function onGenerateOnly() {
    setBusy(true);
    setError("");
    setMessage("Génération en cours…");
    try {
      if (!form.notes.trim() && !form.body_text.trim()) {
        throw new Error("Écris d’abord quelques notes pour l’IA");
      }
      const draft = await generateAi();
      if (draft) {
        setMessage(
          draft.generated_by === "claude"
            ? "Texte amplifié par Claude ✅ — regarde le champ Texte ci-dessous"
            : "Brouillon local prêt ✅"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Génération impossible");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  /** Un clic : génère (IA) puis crée l’aperçu (rapide, sans timeout). */
  async function onCreatePreview() {
    setBusy(true);
    setError("");
    setMessage("Création de l’aperçu…");

    const previewWin = window.open("about:blank", "_blank");

    try {
      if (!form.photo_1.trim() && !form.video_url.trim()) {
        throw new Error("Ajoute d’abord une photo ou une vidéo");
      }

      let payload = form;

      // 1) IA d'abord (optionnel) — si ça time out, on crée quand même
      if (!form.body_text.trim() || !form.h1.trim()) {
        if (!form.notes.trim() && !form.body_text.trim()) {
          throw new Error(
            "Écris des notes pour l’IA (ex. plateau, artiste, ambiance)"
          );
        }
        setMessage("Génération IA…");
        try {
          const generated = await generateAi();
          if (generated) payload = generated;
        } catch {
          setMessage("IA lente — création avec brouillon enrichi…");
        }
      }

      // 2) Création aperçu (jamais d’appel Claude ici)
      setMessage("Enregistrement de l’aperçu…");
      let res: Response;
      try {
        res = await fetch("/api/site-stories/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: payload.notes || payload.body_text,
            body_text: payload.body_text,
            h1: payload.h1,
            slug: payload.slug,
            meta_description: payload.meta_description,
            photo_urls: [payload.photo_1].filter((u) => u.trim()),
            video_url: payload.video_url,
            faqs: payload.faqs,
            show_id: payload.show_id || null,
            generated_by: payload.generated_by,
          }),
        });
      } catch {
        throw new Error(
          "Connexion coupée pendant l’enregistrement. Réessaie."
        );
      }

      const json = await readApiJson(res);
      if (!res.ok) {
        throw new Error(String(json.error || "Création impossible"));
      }

      const previewUrl = String(
        json.preview_url ||
          (json.public_path ? `${json.public_path}?preview=1` : "")
      );

      setForm(emptyForm());
      setMessage(String(json.message || "Aperçu créé ✅"));
      await load();

      if (previewUrl) {
        if (previewWin && !previewWin.closed) {
          previewWin.location.href = previewUrl;
        } else {
          window.open(previewUrl, "_blank", "noopener,noreferrer");
        }
      } else if (previewWin && !previewWin.closed) {
        previewWin.close();
      }
    } catch (err) {
      if (previewWin && !previewWin.closed) previewWin.close();
      setError(err instanceof Error ? err.message : "Création impossible");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  async function previewStory(story: SiteStory) {
    window.open(
      `${story.public_path}?preview=1`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function pushStory(id: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/site-stories/${id}/publish`, {
        method: "POST",
      });
      const json = await readApiJson(res);
      if (!res.ok) {
        throw new Error(String(json.error || "Publication impossible"));
      }
      setMessage(String(json.message || "Publié ✅"));
      await load();
      if (json.public_path) {
        window.open(
          String(json.public_path),
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible");
    } finally {
      setBusy(false);
    }
  }

  function updateFaq(index: number, field: keyof SiteStoryFaq, value: string) {
    setForm((prev) => {
      const faqs = [...prev.faqs];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faqs };
    });
  }

  const canCreate = Boolean(form.photo_1.trim() || form.video_url.trim());

  return (
    <div className="space-y-8">
      <section className="panel space-y-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold">
            Pousser une page sur le site
          </h3>
          <p className="mt-1 text-sm text-muted">
            1) Photo · 2) Créer l’aperçu (IA auto) · 3) Pousser sur{" "}
            <span className="text-cyan">biiipcomedyclub.fr</span>
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label-field">Photo ou vidéo</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-black/20 px-4 py-8 text-sm text-muted hover:border-cyan/40">
              <Upload size={22} className="text-cyan" />
              {uploading
                ? "Upload en cours…"
                : form.photo_1
                  ? "Changer le fichier"
                  : "Choisir / prendre une photo"}
              <span className="px-4 text-center text-xs text-muted/80">
                JPG, PNG, WEBP, HEIC, GIF · ou MP4/MOV (max 4 Mo)
              </span>
              <input
                type="file"
                accept="image/*,video/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.tif,.tiff,.jfif,.mp4,.mov,.webm,.m4v"
                capture="environment"
                className="hidden"
                disabled={uploading || busy}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  void onMediaFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            {form.photo_1 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photo_1}
                alt="Aperçu"
                className="mt-3 h-40 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="mt-3">
              <label className="label-field">Ou URL photo</label>
              <input
                className="input-field"
                value={form.photo_1.startsWith("/") || form.photo_1.startsWith("http") ? form.photo_1 : ""}
                onChange={(e) =>
                  setForm({ ...form, photo_1: e.target.value.trim() })
                }
                placeholder="https://… ou /api/uploads/…"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="label-field">Vidéo (URL YouTube / Vimeo)</label>
            <input
              className="input-field"
              value={form.video_url}
              onChange={(e) =>
                setForm({ ...form, video_url: e.target.value.trim() })
              }
              placeholder="https://youtube.com/…"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label-field">Soirée liée (optionnel)</label>
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
            <label className="label-field">
              Notes (ambiance, artiste…) — pour l’IA
            </label>
            <textarea
              className="input-field min-h-[90px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex. Plateau samedi, Léo Mirage, salle pleine…"
            />
          </div>

          {form.body_text ? (
            <>
              <div className="md:col-span-2">
                <label className="label-field">H1</label>
                <input
                  className="input-field"
                  value={form.h1}
                  onChange={(e) => setForm({ ...form, h1: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label-field">Texte</label>
                <textarea
                  className="input-field min-h-[120px]"
                  value={form.body_text}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      body_text: e.target.value,
                      generated_by: "manual",
                    })
                  }
                />
              </div>
              {form.faqs.length ? (
                <div className="md:col-span-2 space-y-3">
                  <p className="label-field">FAQ</p>
                  {form.faqs.map((faq, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-xl border border-white/10 p-3"
                    >
                      <input
                        className="input-field"
                        value={faq.question}
                        onChange={(e) =>
                          updateFaq(i, "question", e.target.value)
                        }
                      />
                      <textarea
                        className="input-field min-h-[60px]"
                        value={faq.answer}
                        onChange={(e) =>
                          updateFaq(i, "answer", e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void onCreatePreview()}
            disabled={busy || uploading || !canCreate}
          >
            {busy ? "…" : "Créer l’aperçu (IA + page)"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy || uploading}
            onClick={() => void onGenerateOnly()}
          >
            <Sparkles size={16} />
            Générer le texte seulement
          </Button>
        </div>

        {message ? <p className="text-sm text-success">{message}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </section>

      {stories.length ? (
        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold">Pages</h3>
          {stories.map((story) => (
            <div
              key={story._id}
              className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{story.h1 || story.title_en}</p>
                <p className="text-xs text-muted">
                  {story.is_published ? "Publié" : "Brouillon"} · /{story.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  onClick={() => void previewStory(story)}
                >
                  <ExternalLink size={14} /> Aperçu
                </Button>
                <Button
                  onClick={() => void pushStory(story._id)}
                  disabled={busy}
                >
                  {story.is_published
                    ? "Repousser sur le site"
                    : "Pousser sur le site"}
                </Button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold">Galerie</h3>
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
                      Vidéo
                    </div>
                  )}
                </div>
                <div className="p-4 text-sm">
                  {asset.caption || asset.alt_text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Galerie vide"
            description="Le flux principal est au-dessus."
          />
        )}
      </section>
    </div>
  );
}
