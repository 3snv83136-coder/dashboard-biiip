"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReserveForm({ showId, seatsLeft }: { showId: string; seatsLeft: number }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [seats, setSeats] = useState(Math.min(2, seatsLeft));
  const [accepted, setAccepted] = useState(false);
  const [joinClub, setJoinClub] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!accepted) {
      setError("Coche la case pour accepter les conditions de réservation.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          show_id: showId,
          full_name: fullName,
          email,
          seats_count: seats,
          accepted_terms: accepted,
          join_club: joinClub,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(data.ticket_path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className="club-label" htmlFor="name">Nom</label>
      <input id="name" className="club-input" autoComplete="name" placeholder="Prénom Nom" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

      <label className="club-label" htmlFor="email">Email</label>
      <input id="email" className="club-input" type="email" inputMode="email" autoComplete="email" placeholder="prenom@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <div className="club-hp" aria-hidden="true">
        <label>
          Site web
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <span className="club-label">Places</span>
      <div className="club-seats">
        {[1, 2, 3, 4].map((n) => (
          <button key={n} type="button" className="club-seat" aria-pressed={seats === n} disabled={n > seatsLeft} onClick={() => setSeats(n)}>
            {n}
          </button>
        ))}
      </div>

      <label className="club-check">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>J&apos;accepte que mon nom et mon email servent à gérer ma réservation</span>
      </label>
      <label className="club-check" style={{ color: "var(--c-muted)" }}>
        <input type="checkbox" checked={joinClub} onChange={(e) => setJoinClub(e.target.checked)} />
        <span>
          J&apos;adhère gratuitement au Biiip Comedy Club (
          <a href="/adhesion/conditions" target="_blank" rel="noopener">conditions</a>)
        </span>
      </label>

      {error ? <p className="club-error" role="alert">{error}</p> : null}

      <button className="club-btn" type="submit" disabled={busy}>
        {busy ? "Un instant…" : `Réserver ${seats} place${seats > 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
