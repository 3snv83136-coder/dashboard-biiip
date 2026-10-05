"use client";

import { toPng } from "html-to-image";
import { useRef, useState, type ReactNode } from "react";

type Props = {
  memberNumber: string;
  children: ReactNode;
};

/**
 * Enveloppe la carte visuelle + actions mobiles :
 * - Enregistrer / partager en PNG (Photos)
 * - Consigne « écran d'accueil »
 */
export function MemberCardSave({ memberNumber, children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  async function exportPng(): Promise<Blob> {
    const node = cardRef.current;
    if (!node) throw new Error("Carte introuvable");

    // Fond opaque pour Photos / fond d’écran (évite le PNG transparent)
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0b111c",
    });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function saveCard() {
    setBusy(true);
    setHint("");
    try {
      const blob = await exportPng();
      const file = new File([blob], `carte-biiip-${memberNumber}.png`, {
        type: "image/png",
      });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare({ files: [file] }));

      if (canShareFiles) {
        await navigator.share({
          files: [file],
          title: "Carte Biiip",
          text: "Ma carte d'adhérent Biiip Comedy Club",
        });
        setHint("Parfait — enregistre l’image dans Photos, ou fixe-la en fond d’écran.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      setHint("Image téléchargée. Ouvre-la et enregistre-la dans tes Photos.");
    } catch (err) {
      // Annulation du share sheet = normal
      if (err instanceof Error && /AbortError|canceled|cancelled/i.test(err.name + err.message)) {
        return;
      }
      console.error("[member-card] export", err);
      setHint("Impossible d’exporter la carte. Fais une capture d’écran pour l’instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={cardRef} className="club-card-export">
        {children}
      </div>

      <div className="club-card-actions">
        <button
          type="button"
          className="club-btn"
          disabled={busy}
          onClick={() => void saveCard()}
        >
          {busy ? "Préparation…" : "Enregistrer sur mon téléphone"}
        </button>
        <p className="club-card-tip">
          <b>Astuce écran d’accueil</b>
          <br />
          iPhone : Safari → bouton Partager → <i>Sur l’écran d’accueil</i>
          <br />
          Android : menu Chrome → <i>Ajouter à l’écran d’accueil</i>
        </p>
        {hint ? <p className="club-card-hint">{hint}</p> : null}
      </div>
    </>
  );
}
