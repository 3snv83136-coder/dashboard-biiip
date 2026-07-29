"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BOOKING_STATUS_COLORS,
  SHOW_TYPE_LABELS,
} from "@/lib/constants";
import type { Artist, BookingStatus, Show, ShowBooking, ShowType } from "@/lib/types";
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
import { ExternalLink, Plus } from "lucide-react";
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

  const load = useCallback(async () => {
    const res = await fetch("/api/shows");
    const json = await res.json();
    setData(json);
  }, []);

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

  async function createShow() {
    setSaving(true);
    setMessage("");
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
    setOpen(false);
    setForm(emptyForm);
    setMessage("Show ajouté ✅");
    await load();
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

  const artistsForShow = (showId: string) => {
    const ids = (data?.show_bookings ?? [])
      .filter((b) => b.show_id === showId)
      .map((b) => b.artist_id);
    return (data?.artists ?? []).filter((a) => ids.includes(a._id));
  };

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
        <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
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
                      onClick={() => setSelected(show)}
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
          <Button onClick={() => setOpen(true)}>Ajouter un show</Button>
        </EmptyState>
      ) : null}

      {open ? (
        <div className="modal-sheet">
          <div className="modal-panel">
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
                <label className="label-field">Artistes</label>
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">
                  {(data?.artists ?? []).map((artist) => {
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
                            setForm({
                              ...form,
                              artist_ids: checked
                                ? form.artist_ids.filter((id) => id !== artist._id)
                                : [...form.artist_ids, artist._id],
                            })
                          }
                        />
                        {artist.stage_name}
                      </label>
                    );
                  })}
                </div>
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
          <div className="modal-panel">
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
              <p className="label-field">Artistes</p>
              <ul className="space-y-1 text-sm">
                {artistsForShow(selected._id).map((a) => (
                  <li key={a._id}>{a.stage_name}</li>
                ))}
                {!artistsForShow(selected._id).length ? (
                  <li className="text-muted">Aucun artiste lié</li>
                ) : null}
              </ul>
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
                    → {status}
                  </Button>
                )
              )}
            </div>
            <div className="mt-4 flex justify-end">
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
