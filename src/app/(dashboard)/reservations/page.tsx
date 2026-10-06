"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SEAT_RESERVATION_STATUS_LABELS } from "@/lib/constants";
import type { SeatReservation, SeatReservationStatus, Show } from "@/lib/types";
import { Check, Download, ExternalLink, Search, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ShowRow = Show & { is_bookable: boolean };

const STATUS_COLORS: Record<SeatReservationStatus, string> = {
  confirmee: "#00d9ff",
  presente: "#3ddc97",
  annulee: "#e94560",
};

function frDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ReservationsPage() {
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [reservations, setReservations] = useState<SeatReservation[]>([]);
  const [seats, setSeats] = useState<Record<string, number>>({});
  const [showId, setShowId] = useState<string>("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/reservations");
    const json = await res.json();
    setShows(json.shows ?? []);
    setReservations(json.reservations ?? []);
    setSeats(json.seats_reserved ?? {});
    setShowId((cur) => cur || json.shows?.find((s: ShowRow) => s.is_bookable)?._id || json.shows?.[0]?._id || "");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const current = shows.find((s) => s._id === showId);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return reservations
      .filter((r) => r.show_id === showId)
      .filter(
        (r) =>
          !needle ||
          r.full_name.toLowerCase().includes(needle) ||
          r.email.includes(needle) ||
          r.ticket_code.toLowerCase().includes(needle) ||
          (r.member_number || "").toLowerCase().includes(needle)
      );
  }, [reservations, showId, q]);

  const present = rows.filter((r) => r.reservation_status === "presente").reduce((n, r) => n + r.seats_count, 0);

  async function setStatus(r: SeatReservation, status: SeatReservationStatus) {
    if (status === "annulee" && !window.confirm(`Annuler la réservation de ${r.full_name} ? Les places seront libérées.`)) return;
    setBusyId(r._id);
    setError("");
    const res = await fetch(`/api/reservations/${r._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_status: status }),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erreur");
      return;
    }
    await load();
  }

  return (
    <div className="page-stack">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Réservations</h1>
          <p className="text-sm text-muted">
            Réservations gratuites des spectateurs. Un show « Confirmé » ou « Payé » à venir est automatiquement ouvert sur la page publique.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/spectacles" target="_blank" rel="noopener">
            <Button variant="ghost"><ExternalLink size={16} /> Page publique</Button>
          </a>
          <a href={`/api/reservations?format=csv${showId ? `&show_id=${showId}` : ""}`}>
            <Button variant="secondary"><Download size={16} /> Export CSV</Button>
          </a>
        </div>
      </div>

      {shows.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shows.map((s) => {
            const cap = Number(s.capacity) || 19;
            const taken = seats[s._id] ?? 0;
            return (
              <button
                key={s._id}
                onClick={() => setShowId(s._id)}
                className={`panel min-w-[180px] shrink-0 p-3 text-left transition ${s._id === showId ? "border-cyan/60 shadow-cyan" : ""}`}
              >
                <div className="text-xs uppercase text-muted">{frDate(s.show_date)} · {s.start_time}</div>
                <div className="mt-1 font-semibold">{s.title}</div>
                <div className="mt-1 text-xs">
                  <span className={taken >= cap ? "text-neon" : "text-cyan"}>{taken}/{cap} places</span>
                  {!s.is_bookable ? <span className="ml-2 text-muted">· non ouvert</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Aucun show à venir" description="Pose un show « Confirmé » au calendrier pour ouvrir les réservations." />
      )}

      {current ? (
        <div className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <b>{current.title}</b> — {seats[current._id] ?? 0}/{Number(current.capacity) || 19} réservées · {present} présent(s)
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input-field" style={{ paddingLeft: 36 }} placeholder="Nom, email, n° adhérent ou code" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          {rows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Nom</th>
                    <th className="px-3 py-2">N° adhérent</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Places</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-white/5">
                      <td className="px-3 py-2 font-medium">
                        {r.full_name}
                        {r.member_id || r.has_requested_membership ? (
                          <span className="ml-2 text-xs text-cyan">adhérent</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-cyan">
                        {r.member_number || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted">{r.email}</td>
                      <td className="px-3 py-2">{r.seats_count}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.ticket_code}</td>
                      <td className="px-3 py-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: `${STATUS_COLORS[r.reservation_status]}22`, color: STATUS_COLORS[r.reservation_status] }}
                        >
                          {SEAT_RESERVATION_STATUS_LABELS[r.reservation_status]}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {r.reservation_status === "confirmee" ? (
                            <>
                              <Button variant="secondary" disabled={busyId === r._id} onClick={() => setStatus(r, "presente")}>
                                <Check size={14} /> Présent
                              </Button>
                              <Button variant="danger" disabled={busyId === r._id} onClick={() => setStatus(r, "annulee")}>
                                <X size={14} />
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" disabled={busyId === r._id} onClick={() => setStatus(r, "confirmee")}>
                              <Undo2 size={14} /> Rétablir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Aucune réservation pour ce show.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
