"use client";

import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari iOS
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferred(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }

    const ua = navigator.userAgent;
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
    const isMac = /Mac/i.test(ua);

    if (isSafari && isMac) {
      setHint(
        "Sur Safari : Fichier → Ajouter au Dock (ou Partager → Ajouter au Dock)."
      );
      return;
    }
    if (isSafari) {
      setHint("Sur iPhone : Partager → Sur l’écran d’accueil.");
      return;
    }
    setHint(
      "Dans Chrome / Edge : menu ⋮ → Installer Dashboard Biiip… (ou icône ⊕ dans la barre d’adresse)."
    );
  }

  if (installed) {
    return (
      <p className="text-sm text-success">
        L’app est déjà installée sur cet appareil.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void install()}>
        Installer sur cet ordinateur
      </Button>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {!deferred && !hint ? (
        <p className="text-xs text-muted">
          Chrome / Edge : bouton d’installation dans la barre d’adresse. Safari
          Mac : Fichier → Ajouter au Dock.
        </p>
      ) : null}
    </div>
  );
}
