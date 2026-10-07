"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function JoinForm({ source }: { source: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      email.trim().includes("@") &&
      accepted &&
      !busy
    );
  }, [firstName, lastName, email, accepted, busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const first_name = firstName.trim();
    const last_name = lastName.trim();
    if (first_name.length < 2) {
      setError("Indique ton prénom.");
      return;
    }
    if (last_name.length < 2) {
      setError("Indique ton nom.");
      return;
    }
    if (!email.trim()) {
      setError("Indique ton email.");
      return;
    }
    if (!accepted) {
      setError("Coche la case pour accepter le règlement intérieur.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
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
      <label className="club-label" htmlFor="first_name">
        Prénom
      </label>
      <input
        id="first_name"
        className="club-input"
        autoComplete="given-name"
        placeholder="Camille"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
        minLength={2}
        maxLength={80}
      />

      <label className="club-label" htmlFor="last_name">
        Nom
      </label>
      <input
        id="last_name"
        className="club-input"
        autoComplete="family-name"
        placeholder="Dupont"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
        minLength={2}
        maxLength={80}
      />

      <label className="club-label" htmlFor="email">
        Email
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
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <label className="club-check">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          J&apos;accepte le{" "}
          <a href="/adhesion/conditions" target="_blank" rel="noopener">
            règlement intérieur
          </a>{" "}
          et les conditions d&apos;adhésion
        </span>
      </label>
      <label className="club-check" style={{ color: "var(--c-muted)" }}>
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
        />
        <span>Je veux recevoir la programmation (facultatif)</span>
      </label>

      {error ? (
        <p className="club-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="club-btn" type="submit" disabled={!canSubmit}>
        {busy ? "Un instant…" : "J'adhère au Biiip Comedy Club"}
      </button>

      <p className="club-fine">
        Prénom, nom et email sont nécessaires pour ta carte d&apos;adhérent.
        Conservés 3 ans après ton dernier passage. Suppression sur simple
        demande.
      </p>
    </form>
  );
}
