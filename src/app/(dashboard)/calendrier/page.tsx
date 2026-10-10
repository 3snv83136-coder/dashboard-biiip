"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  SHOW_TYPE_LABELS,
} from "@/lib/constants";
import type {
  Artist,
  BookingStatus,
  DocType,
  Show,
  ShowBooking,
  ShowType,
} from "@/lib/types";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, FileText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Payload = {
  shows: Show[];
  show_bookings: ShowBooking[];
  artists: Artist[];
};

const emptyForm = {
  title: "Plateau Biiip",
  show_date: format(new Date(), "yyyy-MM-dd"),
  start_time: "20:30",
  show_type: "plateau" as ShowType,
  booking_status: "pressenti" as BookingStatus,
  capacity: 19,
  billetweb_url: "",
  internal_notes: "",
  is_avant_premiere: false,
  artist_ids: [] as string[],
};

export default function CalendrierPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Show | null>(null);
  const [message, setMessage] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [editArtistIds, setEditArtistIds] = useState<string[]>([]);
  const [docsBusy, setDocsBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/shows");
    const json = await res.json();
    setData(json);
  }, []);

  const sortedArtists = useMemo(() => {
    return [...(data?.artists ?? [])].sort((a, b) =>
      a.stage_name.localeCompare(b.stage_name, "fr")
    );
  }, [data?.artists]);

  const filteredArtists = useMemo(() => {
    const q = artistQuery.trim().toLowerCase();
    if (!q) return sortedArtists;
    return sortedArtists.filter(
      (a) =>
        a.stage_name.toLowerCase().includes(q) ||
        a.legal_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );
  }, [sortedArtists, artistQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const showsByDay = useMemo(() => {
    const map = new Map<string, Show[]>();
    for (const show of data?.shows ?? []) {
      const key = show.show_date;
      map.set(key, [...(map.get(key) ?? []), show]);
    }
    return map;
  }, [data]);

  function openCreate() {
    setForm(emptyForm);
    setArtistQuery("");
    setOpen(true);
  }

  function openSelected(show: Show) {
    setSelected(show);
    setArtistQuery("");
    const ids = (data?.show_bookings ?? [])
      .filter((b) => b.show_id === show._id)
      .sort((a, b) => a.slot_order - b.slot_order)
      .map((b) => b.artist_id);
    setEditArtistIds(ids);
  }

  function toggleArtistId(
    list: string[],
    id: string,
    setList: (next: string[]) => void
  ) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function createShow() {
    setSaving(true);
    setMessage("");
    const selectedIds = [...form.artist_ids];
    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Ça n'est pas passé. On réessaie ?");
      return;
    }
    const json = await res.json();
    setOpen(false);
    setForm(emptyForm);
    setArtistQuery("");
    const n = selectedIds.length;
    setMessage(
      n
        ? `Show ajouté avec ${n} artiste${n > 1 ? "s" : ""} ✅`
        : "Show ajouté ✅ — pense à rattacher des artistes pour les docs"
    );
    await load();
    if (json.show) {
      setSelected(json.show as Show);
      setEditArtistIds(selectedIds);
    }
  }

  async function saveShowArtists() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/shows/${selected._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist_ids: editArtistIds }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Impossible de mettre à jour les artistes");
      return;
    }
    setMessage(
      editArtistIds.length
        ? `Artistes mis à jour (${editArtistIds.length}) ✅`
        : "Artistes retirés du show"
    );
    await load();
  }

  async function sendPackDocs() {
    if (!selected) return;

    const savedIds = (data?.show_bookings ?? [])
      .filter((b) => b.show_id === selected._id)
      .map((b) => b.artist_id)
      .sort();
    const draftIds = [...editArtistIds].sort();
    if (savedIds.join() !== draftIds.join()) {
      await saveShowArtists();
    }

    const booked = sortedArtists.filter(
      (a) => editArtistIds.includes(a._id) && a.email?.trim()
    );
    if (!booked.length) {
      setMessage("Aucun artiste avec email — coche-les et vérifie leurs fiches");
      return;
    }
    const ok = window.confirm(
      `Générer et envoyer le pack docs (conducteur, fiche technique, contrat GUSO, portrait) à ${booked.length} artiste${booked.length > 1 ? "s" : ""} ?`
    );
    if (!ok) return;

    setDocsBusy(true);
    setMessage("");
    const types: DocType[] = [
      "conducteur",
      "fiche_technique",
      "contrat_guso",
      "portrait",
    ];
    let sent = 0;
    let failed = 0;
    for (const artist of booked) {
      for (const doc_type of types) {
        try {
          const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              show_id: selected._id,
              artist_id: artist._id,
              doc_type,
              send: true,
            }),
          });
          if (res.ok) sent += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
    }
    setDocsBusy(false);
    setMessage(
      failed
        ? `Pack : ${sent} envoyé(s), ${failed} échec(s)`
        : `Pack docs envoyé à ${booked.length} artiste${booked.length > 1 ? "s" : ""} ✅`
    );
  }

  async function updateStatus(show: Show, booking_status: BookingStatus) {
    await fetch(`/api/shows/${show._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_status }),
    });
    await load();
    setSelected({ ...show, booking_status });
  }

  async function deleteShow(show: Show) {
    const ok = window.confirm(
      `Retirer « ${show.title} » du ${show.show_date} ?\nLes réservations liées seront aussi supprimées.`
    );
    if (!ok) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/shows/${show._id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMessage(String(json.error || "Suppression impossible"));
      return;
    }
    setSelected(null);
    setMessage("Plateau retiré du calendrier ✅");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="toolbar-row">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, -1))}>
            ←
          </Button>
          <h2 className="min-w-0 flex-1 text-center font-display text-base font-semibold capitalize sm:min-w-[180px] sm:flex-none sm:text-lg">
            {format(cursor, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}>
            →
          </Button>
        </div>
        <Button className="w-full sm:w-auto" onClick={openCreate}>
          <Plus size={16} /> Ajouter un show
        </Button>
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="calendar-scroll">
        <div className="calendar-frame panel overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10 text-center text-[10px] uppercase tracking-wide text-muted sm:text-xs">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="px-0.5 py-2 sm:px-1 sm:py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayShows = showsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            return (
              <div
                key={key}
                className={`min-h-[84px] border-b border-r border-white/5 p-1 sm:min-h-[96px] sm:p-1.5 md:min-h-[110px] md:p-2 ${
                  inMonth ? "" : "opacity-35"
                } ${isSameDay(day, new Date()) ? "bg-cyan/5" : ""}`}
              >
                <div className="mb-1 text-[10px] text-muted sm:text-xs">{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayShows.map((show) => (
                    <button
                      key={show._id}
                      onClick={() => openSelected(show)}
                      className="block w-full truncate rounded-md px-1 py-1 text-left text-[9px] font-semibold text-night sm:px-1.5 sm:text-[10px] md:text-xs"
                      style={{
                        backgroundColor:
                          BOOKING_STATUS_COLORS[show.booking_status],
                      }}
                      title={show.title}
                    >
                      <span className="sm:hidden">{show.start_time}</span>
                      <span className="hidden sm:inline">
                        {show.start_time} · {show.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {Object.entries(BOOKING_STATUS_COLORS).map(([k, color]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {k}
          </span>
        ))}
      </div>

      {!data?.shows.length ? (
        <EmptyState
          title="Aucun show au programme. On remplit la cave ?"
          description="Pose ton premier show pour voir la programmation sur 6–12 mois."
        >
          <Button onClick={openCreate}>Ajouter un show</Button>
        </EmptyState>
      ) : null}

      {open ? (
        <div className="modal-sheet">
          <div className="modal-panel max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold">Nouveau show</h3>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="label-field">Titre</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.show_date}
                    onChange={(e) =>
                      setForm({ ...form, show_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Heure</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Type</label>
                  <select
                    className="input-field"
                    value={form.show_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        show_type: e.target.value as ShowType,
                      })
                    }
                  >
                    {Object.entries(SHOW_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">Statut</label>
                  <select
                    className="input-field"
                    value={form.booking_status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        booking_status: e.target.value as BookingStatus,
                      })
                    }
                  >
                    <option value="pressenti">Pressenti</option>
                    <option value="confirme">Confirmé</option>
                    <option value="paye">Payé</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="label-field mb-0">
                    Artistes du stock
                    {form.artist_ids.length
                      ? ` (${form.artist_ids.length})`
                      : ""}
                  </label>
                  <Link
                    href="/artistes"
                    className="text-xs text-cyan underline"
                    target="_blank"
                  >
                    Gérer le stock
                  </Link>
                </div>
                {!sortedArtists.length ? (
                  <p className="rounded-xl border border-dashed border-white/15 p-3 text-sm text-muted">
                    Aucun artiste en stock.{" "}
                    <Link href="/artistes" className="text-cyan underline">
                      Ajoute-en d’abord
                    </Link>{" "}
                    puis reviens ici.
                  </p>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        className="input-field pl-8 text-sm"
                        placeholder="Chercher un artiste…"
                        value={artistQuery}
                        onChange={(e) => setArtistQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">
                      {filteredArtists.map((artist) => {
                        const checked = form.artist_ids.includes(artist._id);
                        return (
                          <label
                            key={artist._id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleArtistId(
                                  form.artist_ids,
                                  artist._id,
                                  (artist_ids) => setForm({ ...form, artist_ids })
                                )
                              }
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {artist.stage_name}
                              {artist.email ? (
                                <span className="ml-1 text-xs text-muted">
                                  · {artist.email}
                                </span>
                              ) : (
                                <span className="ml-1 text-xs text-warn">
                                  · pas d’email
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                      {!filteredArtists.length ? (
                        <p className="px-2 py-1 text-sm text-muted">
                          Aucun résultat
                        </p>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_avant_premiere}
                    onChange={(e) =>
                      setForm({ ...form, is_avant_premiere: e.target.checked })
                    }
                  />
                  Avant-première (ciblage adhérents ≥ 3 passages)
                </label>
              </div>
              <div>
                <label className="label-field">Lien Billetweb</label>
                <input
                  className="input-field"
                  value={form.billetweb_url}
                  onChange={(e) =>
                    setForm({ ...form, billetweb_url: e.target.value })
                  }
                  placeholder="https://www.billetweb.fr/..."
                />
              </div>
              <div>
                <label className="label-field">Notes internes</label>
                <textarea
                  className="input-field min-h-[80px]"
                  value={form.internal_notes}
                  onChange={(e) =>
                    setForm({ ...form, internal_notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createShow} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="modal-sheet">
          <div className="modal-panel max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {selected.title}
                </h3>
                <p className="text-sm text-muted">
                  {selected.show_date} · {selected.start_time} ·{" "}
                  {SHOW_TYPE_LABELS[selected.show_type]} · jauge{" "}
                  {selected.capacity}
                </p>
              </div>
              <StatusBadge status={selected.booking_status} />
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="label-field mb-0">
                  Artistes du stock
                  {editArtistIds.length ? ` (${editArtistIds.length})` : ""}
                </p>
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void saveShowArtists()}
                >
                  {saving ? "…" : "Enregistrer artistes"}
                </Button>
              </div>
              {!sortedArtists.length ? (
                <p className="text-sm text-muted">
                  Stock vide —{" "}
                  <Link href="/artistes" className="text-cyan underline">
                    ajouter des artistes
                  </Link>
                </p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      className="input-field pl-8 text-sm"
                      placeholder="Chercher…"
                      value={artistQuery}
                      onChange={(e) => setArtistQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">
                    {filteredArtists.map((artist) => {
                      const checked = editArtistIds.includes(artist._id);
                      return (
                        <label
                          key={artist._id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleArtistId(
                                editArtistIds,
                                artist._id,
                                setEditArtistIds
                              )
                            }
                          />
                          {artist.stage_name}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {selected.billetweb_url ? (
              <a
                href={selected.billetweb_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-cyan hover:underline"
              >
                Billetweb <ExternalLink size={14} />
              </a>
            ) : null}
            {selected.internal_notes ? (
              <p className="mt-3 text-sm text-muted">{selected.internal_notes}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {(["pressenti", "confirme", "paye"] as BookingStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    variant="secondary"
                    onClick={() => updateStatus(selected, status)}
                  >
                    → {BOOKING_STATUS_LABELS[status]}
                  </Button>
                )
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              Pour ouvrir les réservations publiques (/spectacles), passe le show en{" "}
              <span className="text-cyan">Confirmé</span> ou{" "}
              <span className="text-cyan">Payé</span>.
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(selected.is_avant_premiere)}
                onChange={(e) => {
                  const is_avant_premiere = e.target.checked;
                  void fetch(`/api/shows/${selected._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_avant_premiere }),
                  }).then(async () => {
                    await load();
                    setSelected({ ...selected, is_avant_premiere });
                  });
                }}
              />
              Avant-première
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/documents?show_id=${selected._id}`}>
                <Button variant="secondary">
                  <FileText size={16} /> Documents
                </Button>
              </Link>
              <Button
                disabled={docsBusy || !editArtistIds.length}
                onClick={() => void sendPackDocs()}
              >
                <FileText size={16} />
                {docsBusy
                  ? "Envoi du pack…"
                  : "Envoyer le pack docs aux artistes"}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="danger"
                disabled={saving}
                onClick={() => void deleteShow(selected)}
              >
                Retirer du calendrier
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
