"use client";

import { InstallAppButton } from "@/components/InstallAppButton";
import { Button } from "@/components/ui/Button";
import type { User } from "@/lib/types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type PublicUser = Omit<User, "password_hash">;

const HERO =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80";

export default function ReglagesPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/users");
    if (!res.ok) {
      setError("Réservé au gérant (admin).");
      return;
    }
    const json = await res.json();
    setUsers(json.users ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resetDemo() {
    const res = await fetch("/api/seed", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Impossible de réinitialiser");
      return;
    }
    setMessage(json.message);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="panel relative overflow-hidden">
        <div className="relative h-36 w-full sm:h-44">
          <Image
            src={HERO}
            alt="Réglages"
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="font-display text-xl font-semibold text-white">
              Réglages
            </h3>
            <p className="text-sm text-white/75">
              Utilisateurs, données et installation de l’app
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="font-display text-lg font-semibold">Utilisateurs</h3>
        <p className="mt-1 text-sm text-muted">
          Rôles : admin (tout), staff (opérationnel), artist (son espace
          seulement).
        </p>
        {error ? <p className="mt-3 text-sm text-neon">{error}</p> : null}
        <div className="mt-4 space-y-2">
          {users.map((u) => (
            <div
              key={u._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{u.full_name}</p>
                <p className="text-muted">{u.email}</p>
              </div>
              <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs text-cyan">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel space-y-3 p-5">
        <h3 className="font-display text-lg font-semibold">Données démo</h3>
        <p className="text-sm text-muted">
          Réinitialise le store mémoire (shows, artistes, contacts…). Utile
          pendant le build avant MongoDB Atlas.
        </p>
        <Button variant="secondary" onClick={resetDemo}>
          Réinitialiser les données démo
        </Button>
        {message ? <p className="text-sm text-success">{message}</p> : null}
      </div>

      <div className="panel space-y-3 p-5">
        <h3 className="font-display text-lg font-semibold">
          Installer sur l’ordinateur
        </h3>
        <p className="text-sm text-muted">
          Ajoute Dashboard Biiip comme une app (Dock / menu Applications), sans
          passer par l’App Store.
        </p>
        <InstallAppButton />
      </div>

      <div className="panel space-y-2 p-5 text-sm text-muted">
        <h3 className="font-display text-lg font-semibold text-white">
          Variables d’environnement
        </h3>
        <p>MONGODB_URI · AUTH_SECRET · BREVO_* · ANTHROPIC_API_KEY</p>
        <p>Voir integrations.md pour le détail.</p>
      </div>
    </div>
  );
}
