"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinForm({ source }: { source: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!accepted) {
      setError("Coche la case pour accepter les conditions d'adhésion.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          accepted_terms: accepted,
          consent_communications: newsletter,
          signup_source: source,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(data.card_path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className="club-label" htmlFor="email">
        Ton email
      </label>
      <input
        id="email"
        className="club-input"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="prenom@exemple.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="club-hp" aria-hidden="true">
        <label>
          Site web
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <label className="club-check">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>
          J&apos;accepte les{" "}
          <a href="/adhesion/conditions" target="_blank" rel="noopener">
            conditions d&apos;adhésion
          </a>
        </span>
      </label>
      <label className="club-check" style={{ color: "var(--c-muted)" }}>
        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
        <span>Je veux recevoir la programmation (facultatif)</span>
      </label>

      {error ? <p className="club-error" role="alert">{error}</p> : null}

      <button className="club-btn" type="submit" disabled={busy}>
        {busy ? "Un instant…" : "J'adhère au Biiip Comedy Club"}
      </button>

      <p className="club-fine">
        Ton email sert uniquement à gérer ton adhésion (et la programmation si tu l&apos;acceptes).
        Conservé 3 ans après ton dernier passage. Suppression sur simple demande.
      </p>
    </form>
  );
}
