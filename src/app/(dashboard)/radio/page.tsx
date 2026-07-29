"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  RADIO_EPISODE_STATUS_COLORS,
  RADIO_EPISODE_STATUS_LABELS,
  RADIO_GUEST_ROLE_LABELS,
} from "@/lib/constants";
import type {
  Artist,
  RadioEpisode,
  RadioEpisodeStatus,
  RadioGuest,
  RadioGuestRole,
} from "@/lib/types";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Payload = {
  radio_episodes: RadioEpisode[];
  radio_guests: RadioGuest[];
  artists: Artist[];
};

const emptyForm = {
  title: "Radioactive",
  episode_date: format(new Date(), "yyyy-MM-dd"),
  start_time: "19:00",
  end_time: "20:00",
  episode_status: "draft" as RadioEpisodeStatus,
  theme: "",
  synopsis: "",
  host_name: "",
  conductor_content: "",
  playlist_notes: "",
  technical_notes: "",
  stream_url: "",
  internal_notes: "",
};

export default function RadioPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RadioEpisode | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [guestForm, setGuestForm] = useState({
    guest_name: "",
    artist_id: "",
    guest_role: "invite" as RadioGuestRole,
    segment_title: "",
    segment_duration_min: 15,
    talking_points: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/radio-episodes");
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId || !data) {
      setDraft(null);
      return;
    }
    const ep = data.radio_episodes.find((e) => e._id === selectedId) ?? null;
    setDraft(ep ? { ...ep } : null);
  }, [selectedId, data]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, RadioEpisode[]>();
    for (const ep of data?.radio_episodes ?? []) {
      map.set(ep.episode_date, [...(map.get(ep.episode_date) ?? []), ep]);
    }
    return map;
  }, [data]);

  const guests = useMemo(
    () =>
      (data?.radio_guests ?? [])
        .filter((g) => g.radio_episode_id === selectedId)
        .sort((a, b) => a.slot_order - b.slot_order),
    [data, selectedId]
  );

  async function createEpisode() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/radio-episodes", {
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
    setCreateOpen(false);
    setForm(emptyForm);
    setMessage("Émission posée ✅");
    await load();
    setSelectedId(json.radio_episode._id);
  }

  async function saveEpisode() {
    if (!draft) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/radio-episodes/${draft._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Ça n'est pas passé. On réessaie ?");
      return;
    }
    setMessage("Émission enregistrée ✅");
    await load();
  }

  async function addGuest() {
    if (!selectedId) return;
    setSaving(true);
    await fetch("/api/radio-guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        radio_episode_id: selectedId,
        ...guestForm,
        artist_id: guestForm.artist_id || null,
      }),
    });
    setSaving(false);
    setGuestForm({
      guest_name: "",
      artist_id: "",
      guest_role: "invite",
      segment_title: "",
      segment_duration_min: 15,
      talking_points: "",
    });
    await load();
  }

  async function removeGuest(id: string) {
    await fetch(`/api/radio-guests/${id}`, { method: "DELETE" });
    await load();
  }

  function fillConductorTemplate() {
    if (!draft) return;
    const guestLines = guests
      .map(
        (g, i) =>
          `${draft.start_time} +${(i + 1) * 10} min — ${g.guest_name} (${RADIO_GUEST_ROLE_LABELS[g.guest_role]}) · ${g.segment_title || "segment"}`
      )
      .join("\n");
    setDraft({
      ...draft,
      conductor_content: `# Conducteur — ${draft.title}

**Date** : ${draft.episode_date} · ${draft.start_time} → ${draft.end_time}
**Thème** : ${draft.theme || "À définir"}
**Animateur** : ${draft.host_name || "—"}

## Déroulé
${draft.start_time} — Générique / jingle
Accueil & pitch
${guestLines || "— Ajoute des invités pour peupler le déroulé —"}
Outro · annonces soirées Biiip · générique de fin
`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="toolbar-row">
        <div>
          <p className="text-sm text-muted">
            Web radio · pose une émission, construis le conducteur et les
            invités.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Nouvelle émission
        </Button>
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
            const dayEps = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={`min-h-[84px] border-b border-r border-white/5 p-1 sm:min-h-[96px] sm:p-1.5 md:min-h-[110px] md:p-2 ${
                  isSameMonth(day, cursor) ? "" : "opacity-35"
                } ${isSameDay(day, new Date()) ? "bg-cyan/5" : ""}`}
              >
                <div className="mb-1 text-[10px] text-muted sm:text-xs">{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayEps.map((ep) => (
                    <button
                      key={ep._id}
                      onClick={() => setSelectedId(ep._id)}
                      className="block w-full truncate rounded-md px-1 py-1 text-left text-[9px] font-semibold text-night sm:px-1.5 sm:text-[10px] md:text-xs"
                      style={{
                        backgroundColor:
                          RADIO_EPISODE_STATUS_COLORS[ep.episode_status],
                      }}
                    >
                      <span className="sm:hidden">{ep.start_time}</span>
                      <span className="hidden sm:inline">
                        {ep.start_time} · {ep.title}
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
        {Object.entries(RADIO_EPISODE_STATUS_LABELS).map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  RADIO_EPISODE_STATUS_COLORS[k as RadioEpisodeStatus],
              }}
            />
            {label}
          </span>
        ))}
      </div>

      {!data?.radio_episodes.length ? (
        <EmptyState
          title="Aucune émission au programme"
          description="On lance Radioactive ? Pose la première date."
        >
          <Button onClick={() => setCreateOpen(true)}>Nouvelle émission</Button>
        </EmptyState>
      ) : null}

      {draft ? (
        <div className="panel space-y-5 overflow-hidden p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold">{draft.title}</h3>
              <p className="text-sm text-muted">
                {draft.episode_date} · {draft.start_time} → {draft.end_time}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-night"
              style={{
                backgroundColor:
                  RADIO_EPISODE_STATUS_COLORS[draft.episode_status],
              }}
            >
              {RADIO_EPISODE_STATUS_LABELS[draft.episode_status]}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-field">Titre</label>
              <input
                className="input-field"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Statut</label>
              <select
                className="input-field"
                value={draft.episode_status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    episode_status: e.target.value as RadioEpisodeStatus,
                  })
                }
              >
                {Object.entries(RADIO_EPISODE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Date</label>
              <input
                type="date"
                className="input-field"
                value={draft.episode_date}
                onChange={(e) =>
                  setDraft({ ...draft, episode_date: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Début</label>
                <input
                  type="time"
                  className="input-field"
                  value={draft.start_time}
                  onChange={(e) =>
                    setDraft({ ...draft, start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label-field">Fin</label>
                <input
                  type="time"
                  className="input-field"
                  value={draft.end_time}
                  onChange={(e) =>
                    setDraft({ ...draft, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="label-field">Animateur</label>
              <input
                className="input-field"
                value={draft.host_name}
                onChange={(e) =>
                  setDraft({ ...draft, host_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label-field">Thème</label>
              <input
                className="input-field"
                value={draft.theme}
                onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Synopsis</label>
              <textarea
                className="input-field min-h-[70px]"
                value={draft.synopsis}
                onChange={(e) =>
                  setDraft({ ...draft, synopsis: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="label-field mb-0">Conducteur</label>
              <Button variant="secondary" onClick={fillConductorTemplate}>
                Générer le squelette
              </Button>
            </div>
            <textarea
              className="input-field min-h-[180px] font-mono text-xs"
              value={draft.conductor_content}
              onChange={(e) =>
                setDraft({ ...draft, conductor_content: e.target.value })
              }
              placeholder="Déroulé minute par minute…"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-field">Playlist / jingles</label>
              <textarea
                className="input-field min-h-[90px]"
                value={draft.playlist_notes}
                onChange={(e) =>
                  setDraft({ ...draft, playlist_notes: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label-field">Notes techniques</label>
              <textarea
                className="input-field min-h-[90px]"
                value={draft.technical_notes}
                onChange={(e) =>
                  setDraft({ ...draft, technical_notes: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label-field">Lien stream / replay</label>
              <input
                className="input-field"
                value={draft.stream_url}
                onChange={(e) =>
                  setDraft({ ...draft, stream_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label-field">Notes internes</label>
              <input
                className="input-field"
                value={draft.internal_notes}
                onChange={(e) =>
                  setDraft({ ...draft, internal_notes: e.target.value })
                }
              />
            </div>
          </div>

          <section className="space-y-3 border-t border-white/10 pt-5">
            <h4 className="font-display text-lg font-semibold">Invités</h4>
            {guests.length ? (
              <div className="space-y-2">
                {guests.map((g) => (
                  <div
                    key={g._id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-black/20 p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {g.slot_order}. {g.guest_name}{" "}
                        <span className="text-xs text-cyan">
                          · {RADIO_GUEST_ROLE_LABELS[g.guest_role]}
                        </span>
                      </p>
                      <p className="text-sm text-muted">
                        {g.segment_title || "Sans titre"} ·{" "}
                        {g.segment_duration_min} min
                      </p>
                      {g.talking_points ? (
                        <p className="mt-1 text-xs text-muted">
                          {g.talking_points}
                        </p>
                      ) : null}
                    </div>
                    <button
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-neon"
                      onClick={() => removeGuest(g._id)}
                      aria-label="Retirer l'invité"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Pas encore d’invité.</p>
            )}

            <div className="grid gap-3 rounded-xl border border-white/10 p-3 md:grid-cols-2">
              <div>
                <label className="label-field">Depuis le répertoire</label>
                <select
                  className="input-field"
                  value={guestForm.artist_id}
                  onChange={(e) => {
                    const artist = data?.artists.find(
                      (a) => a._id === e.target.value
                    );
                    setGuestForm({
                      ...guestForm,
                      artist_id: e.target.value,
                      guest_name: artist?.stage_name || guestForm.guest_name,
                    });
                  }}
                >
                  <option value="">Libre / hors répertoire</option>
                  {(data?.artists ?? []).map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.stage_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Nom</label>
                <input
                  className="input-field"
                  value={guestForm.guest_name}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, guest_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label-field">Rôle</label>
                <select
                  className="input-field"
                  value={guestForm.guest_role}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      guest_role: e.target.value as RadioGuestRole,
                    })
                  }
                >
                  {Object.entries(RADIO_GUEST_ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Durée (min)</label>
                <input
                  type="number"
                  className="input-field"
                  value={guestForm.segment_duration_min}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      segment_duration_min: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="label-field">Segment</label>
                <input
                  className="input-field"
                  value={guestForm.segment_title}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      segment_title: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="label-field">Points à aborder</label>
                <input
                  className="input-field"
                  value={guestForm.talking_points}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      talking_points: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  variant="secondary"
                  onClick={addGuest}
                  disabled={saving || !guestForm.guest_name}
                >
                  Ajouter l’invité
                </Button>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedId(null)}>
              Fermer
            </Button>
            <Button onClick={saveEpisode} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer l’émission"}
            </Button>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="modal-sheet">
          <div className="modal-panel">
            <h3 className="font-display text-lg font-semibold">
              Nouvelle émission
            </h3>
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
                    value={form.episode_date}
                    onChange={(e) =>
                      setForm({ ...form, episode_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Statut</label>
                  <select
                    className="input-field"
                    value={form.episode_status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        episode_status: e.target.value as RadioEpisodeStatus,
                      })
                    }
                  >
                    {Object.entries(RADIO_EPISODE_STATUS_LABELS).map(
                      ([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Début</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Fin</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Thème</label>
                <input
                  className="input-field"
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">Animateur</label>
                <input
                  className="input-field"
                  value={form.host_name}
                  onChange={(e) =>
                    setForm({ ...form, host_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createEpisode} disabled={saving}>
                Créer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
