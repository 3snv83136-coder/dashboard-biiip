"use client";

import { fileToPhotoDataUrl } from "@/lib/image-resize";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PortalArtist = {
  _id: string;
  stage_name: string;
  legal_name: string;
  email: string;
  phone: string;
  bio: string;
  photo_url: string;
  instagram_handle: string;
  tiktok_handle: string;
  technical_needs: string;
  dietary_notes: string;
  city: string;
};

const empty: PortalArtist = {
  _id: "",
  stage_name: "",
  legal_name: "",
  email: "",
  phone: "",
  bio: "",
  photo_url: "",
  instagram_handle: "",
  tiktok_handle: "",
  technical_needs: "",
  dietary_notes: "",
  city: "",
};

type Step = {
  key: keyof PortalArtist;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "textarea" | "photo";
  required?: boolean;
};

const STEPS: Step[] = [
  {
    key: "stage_name",
    label: "Nom de scène",
    placeholder: "Ex. Léo Mirage",
    required: true,
  },
  {
    key: "legal_name",
    label: "Nom civil",
    placeholder: "Pour les contrats",
  },
  {
    key: "city",
    label: "Ville",
    placeholder: "Ex. Toulon",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "toi@email.com",
  },
  {
    key: "phone",
    label: "Téléphone",
    type: "tel",
    placeholder: "06…",
  },
  {
    key: "instagram_handle",
    label: "Instagram",
    placeholder: "@toncompte",
  },
  {
    key: "tiktok_handle",
    label: "TikTok",
    placeholder: "@toncompte",
  },
  {
    key: "photo_url",
    label: "Ta photo",
    type: "photo",
  },
  {
    key: "bio",
    label: "Bio / présentation",
    type: "textarea",
    placeholder: "Ton style, ton parcours…",
  },
  {
    key: "technical_needs",
    label: "Besoins techniques",
    type: "textarea",
    placeholder: "Micro, lumières, musique d’entrée…",
  },
  {
    key: "dietary_notes",
    label: "Allergies / repas",
    placeholder: "Optionnel",
  },
];

export default function MaFicheFormPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PortalArtist>(empty);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = useMemo(
    () => STEPS.map((_, i) => (i <= step ? "on" : "")),
    [step]
  );

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/artist-portal");
      const json = await res.json();
      if (!json.authenticated || !json.artist) {
        router.replace("/ma-fiche");
        return;
      }
      setForm({ ...empty, ...json.artist });
      setLoading(false);
    })();
  }, [router]);

  function validateCurrent(): boolean {
    if (!current.required) return true;
    const value = String(form[current.key] ?? "").trim();
    if (!value) {
      setError("Ce champ est obligatoire.");
      return false;
    }
    return true;
  }

  async function onPickPhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToPhotoDataUrl(file);
      setForm((f) => ({ ...f, photo_url: dataUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload impossible");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveAll() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/artist-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Enregistrement impossible");
      return false;
    }
    setMessage(json.message || "Fiche enregistrée ✅");
    return true;
  }

  async function onNext(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateCurrent()) return;

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    await saveAll();
  }

  async function logout() {
    await fetch("/api/artist-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.replace("/ma-fiche");
  }

  if (loading) {
    return (
      <div className="spectacle-shell">
        <p className="text-center text-white/60">Chargement…</p>
      </div>
    );
  }

  const value = String(form[current.key] ?? "");

  return (
    <>
      <div className="spectacle-bg" aria-hidden />
      <div className="spectacle-stars" aria-hidden />
      <div className="spectacle-shell">
        <div className="spectacle-card space-y-4">
          <div>
            <h1 className="spectacle-title">Ta fiche</h1>
            <p className="spectacle-sub">Une question à la fois</p>
          </div>

          <div className="spectacle-progress" aria-hidden>
            {progress.map((cls, i) => (
              <span key={i} className={cls} />
            ))}
          </div>
          <p className="spectacle-step-count">
            Étape {step + 1} / {STEPS.length}
          </p>

          <form onSubmit={(e) => void onNext(e)} className="space-y-4">
            <div>
              <label className="spectacle-label" htmlFor={current.key}>
                {current.label}
                {current.required ? " *" : ""}
              </label>

              {current.type === "photo" ? (
                <div className="space-y-3">
                  {form.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photo_url}
                      alt="Aperçu"
                      className="spectacle-photo-preview mx-auto block ring-1 ring-white/15"
                    />
                  ) : (
                    <div className="spectacle-photo-preview mx-auto flex items-center justify-center border border-dashed border-white/20 text-base text-white/40">
                      Pas encore de photo
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    id={current.key}
                    type="file"
                    accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.tif,.tiff,.jfif"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      void onPickPhoto(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    className="spectacle-btn"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading
                      ? "Traitement…"
                      : form.photo_url
                        ? "Changer la photo"
                        : "Choisir / prendre une photo"}
                  </button>

                  {form.photo_url ? (
                    <button
                      type="button"
                      className="spectacle-link mx-auto block w-full text-center"
                      onClick={() => setForm({ ...form, photo_url: "" })}
                    >
                      Supprimer la photo
                    </button>
                  ) : null}

                  <p className="text-center text-xs text-white/40">
                    Ou colle un lien ci-dessous
                  </p>
                  <input
                    className="spectacle-input"
                    type="url"
                    value={
                      form.photo_url.startsWith("data:") ? "" : form.photo_url
                    }
                    placeholder="https://…"
                    onChange={(e) =>
                      setForm({ ...form, photo_url: e.target.value })
                    }
                  />
                </div>
              ) : current.type === "textarea" ? (
                <textarea
                  id={current.key}
                  className="spectacle-textarea"
                  value={value}
                  placeholder={current.placeholder}
                  autoFocus
                  onChange={(e) =>
                    setForm({ ...form, [current.key]: e.target.value })
                  }
                />
              ) : (
                <input
                  id={current.key}
                  className="spectacle-input"
                  type={current.type || "text"}
                  value={value}
                  placeholder={current.placeholder}
                  autoFocus
                  required={current.required}
                  onChange={(e) =>
                    setForm({ ...form, [current.key]: e.target.value })
                  }
                />
              )}
            </div>

            {error ? <p className="spectacle-error">{error}</p> : null}
            {message ? <p className="spectacle-ok">{message}</p> : null}

            <div className="spectacle-nav">
              {step > 0 ? (
                <button
                  type="button"
                  className="spectacle-btn spectacle-btn-ghost"
                  onClick={() => {
                    setError("");
                    setStep((s) => s - 1);
                  }}
                >
                  Retour
                </button>
              ) : (
                <span />
              )}
              <button
                className="spectacle-btn"
                type="submit"
                disabled={busy || uploading}
              >
                {busy ? "…" : isLast ? "Terminer" : "Suivant"}
              </button>
            </div>
          </form>

          <button
            type="button"
            className="spectacle-link mx-auto block w-full text-center"
            onClick={() => void logout()}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}
