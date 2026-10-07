"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdhesionQrPanel } from "@/components/members/AdhesionQrPanel";
import {
  AVANT_PREMIERE_MIN_VISITS,
  MEMBERSHIP_STATUS_COLORS,
  MEMBERSHIP_STATUS_LABELS,
  SEAT_RESERVATION_STATUS_LABELS,
} from "@/lib/constants";
import {
  DEFAULT_MEMBERSHIP_FEE_AMOUNT,
  MEMBERSHIP_TERMS_BODY,
  MEMBERSHIP_TERMS_TITLE,
  MEMBERSHIP_TERMS_VERSION,
} from "@/lib/membership-terms";
import type {
  Member,
  MembershipStatus,
  SeatReservationStatus,
} from "@/lib/types";
import {
  Download,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type MemberRow = Member & {
  visits_count?: number;
  is_avant_premiere_eligible?: boolean;
};

type NotifyAudience =
  | "all_consent"
  | "avant_premiere"
  | "never_visited"
  | "has_visited";

const NOTIFY_AUDIENCE_LABELS: Record<NotifyAudience, string> = {
  all_consent: "Tous (consentement infos)",
  avant_premiere: `Avant-première (≥${AVANT_PREMIERE_MIN_VISITS} passages)`,
  never_visited: "Jamais venus (0 passage)",
  has_visited: "Déjà venus (≥1 passage)",
};

function canReceiveInfo(m: MemberRow) {
  return (
    m.membership_status === "active" &&
    Boolean(m.email?.trim()) &&
    m.consent_communications
  );
}

function filterNotifyAudience(pool: MemberRow[], audience: NotifyAudience) {
  const base = pool.filter(canReceiveInfo);
  if (audience === "avant_premiere") {
    return base.filter(
      (m) => (m.visits_count ?? 0) >= AVANT_PREMIERE_MIN_VISITS
    );
  }
  if (audience === "never_visited") {
    return base.filter((m) => (m.visits_count ?? 0) === 0);
  }
  if (audience === "has_visited") {
    return base.filter((m) => (m.visits_count ?? 0) >= 1);
  }
  return base;
}

type VisitRow = {
  _id: string;
  show_title: string;
  show_date: string | null;
  start_time: string | null;
  seats_count: number;
  reservation_status: SeatReservationStatus;
  ticket_code: string;
  did_attend: boolean;
  created_at: string;
};

type MemberDetail = {
  member: Member;
  visits_count: number;
  is_avant_premiere_eligible: boolean;
  history: VisitRow[];
};

const STATUS_VISIT_COLORS: Record<SeatReservationStatus, string> = {
  confirmee: "#00d9ff",
  presente: "#3ddc97",
  annulee: "#e94560",
};

function frDate(d: string | null) {
  if (!d) return "—";
  return new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const emptyForm = () => ({
  full_name: "",
  email: "",
  phone: "",
  address_line: "",
  postal_code: "",
  city: "Toulon",
  membership_fee_amount: String(DEFAULT_MEMBERSHIP_FEE_AMOUNT),
  membership_status: "active" as MembershipStatus,
  is_fee_paid: true,
  accepted_terms: false,
  consent_communications: true,
  internal_notes: "",
});

export default function AdherentsPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [q, setQ] = useState("");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyAudience, setNotifyAudience] =
    useState<NotifyAudience>("all_consent");
  const [notifyPool, setNotifyPool] = useState<MemberRow[]>([]);
  const [notifySelected, setNotifySelected] = useState<string[]>([]);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const load = useCallback(async (query = "", eligible = onlyEligible) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (eligible) params.set("eligible_avant_premiere", "1");
    const res = await fetch(`/api/members?${params}`);
    const json = await res.json();
    setMembers(json.members ?? []);
  }, [onlyEligible]);

  useEffect(() => {
    void load(q, onlyEligible);
  }, [load, onlyEligible]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
    setError("");
  }

  function openEdit(m: Member) {
    setEditingId(m._id);
    setForm({
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      address_line: m.address_line,
      postal_code: m.postal_code,
      city: m.city,
      membership_fee_amount: String(m.membership_fee_amount),
      membership_status: m.membership_status,
      is_fee_paid: m.is_fee_paid,
      accepted_terms: m.accepted_terms,
      consent_communications: m.consent_communications,
      internal_notes: m.internal_notes,
    });
    setOpen(true);
    setError("");
  }

  async function openDetail(m: MemberRow) {
    setDetailBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/members/${m._id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fiche introuvable");
      setDetail({
        member: json.member,
        visits_count: json.visits_count ?? 0,
        is_avant_premiere_eligible: Boolean(json.is_avant_premiere_eligible),
        history: json.history ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDetailBusy(false);
    }
  }

  async function saveMember() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!editingId && !form.accepted_terms) {
        throw new Error("Il faut accepter les conditions d’adhésion");
      }
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        address_line: form.address_line,
        postal_code: form.postal_code,
        city: form.city,
        membership_fee_amount: Number(form.membership_fee_amount),
        membership_status: form.membership_status,
        is_fee_paid: form.is_fee_paid,
        accepted_terms: form.accepted_terms || Boolean(editingId),
        consent_communications: form.consent_communications,
        internal_notes: form.internal_notes,
      };

      const res = editingId
        ? await fetch(`/api/members/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json.error || "Enregistrement impossible"));
      }
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      setMessage(editingId ? "Adhérent mis à jour ✅" : "Adhérent ajouté ✅");
      await load(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMember(m: Member) {
    const ok = window.confirm(
      `Supprimer « ${m.full_name} » du registre des adhérents ?`
    );
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/members/${m._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json.error || "Suppression impossible"));
      }
      setMessage("Adhérent supprimé ✅");
      await load(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function sendCard(m: Member) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/members/${m._id}/send-card`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json.error || "Envoi de la carte impossible"));
      }
      setMessage(String(json.message || "Carte envoyée ✅"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const notifyRecipients = useMemo(
    () => filterNotifyAudience(notifyPool, notifyAudience),
    [notifyPool, notifyAudience]
  );

  const notifySelectedMembers = useMemo(() => {
    const set = new Set(notifySelected);
    return notifyRecipients.filter((m) => set.has(m._id));
  }, [notifyRecipients, notifySelected]);

  async function openNotify() {
    setNotifyOpen(true);
    setError("");
    setNotifySubject("");
    setNotifyMessage("");
    setNotifyAudience("all_consent");
    setNotifySelected([]);
    setNotifyLoading(true);
    try {
      const res = await fetch("/api/members?status=active");
      const json = await res.json();
      const pool = (json.members ?? []) as MemberRow[];
      setNotifyPool(pool);
      setNotifySelected(filterNotifyAudience(pool, "all_consent").map((m) => m._id));
    } catch {
      setError("Impossible de charger les destinataires");
      setNotifyPool([]);
    } finally {
      setNotifyLoading(false);
    }
  }

  function applyNotifyAudience(audience: NotifyAudience) {
    setNotifyAudience(audience);
    setNotifySelected(filterNotifyAudience(notifyPool, audience).map((m) => m._id));
  }

  function toggleNotifyMember(id: string) {
    setNotifySelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllNotify() {
    setNotifySelected(notifyRecipients.map((m) => m._id));
  }

  function clearNotifySelection() {
    setNotifySelected([]);
  }

  async function sendNotify() {
    if (!notifySelected.length) {
      setError("Sélectionne au moins un destinataire");
      return;
    }
    const ok = window.confirm(
      `Envoyer cet email à ${notifySelected.length} adhérent${
        notifySelected.length > 1 ? "s" : ""
      } ?`
    );
    if (!ok) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/members/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: notifySubject,
          message: notifyMessage,
          only_consent: true,
          audience: notifyAudience,
          member_ids: notifySelected,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json.error || "Envoi impossible"));
      }
      setNotifyOpen(false);
      setNotifySubject("");
      setNotifyMessage("");
      setNotifySelected([]);
      setMessage(String(json.message || "Envoyé ✅"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Adhérents</h2>
        <p className="mt-1 text-sm text-muted">
          Registre association. Adhésion gratuite : les inscriptions par QR code
          (page publique{" "}
          <a href="/adhesion" target="_blank" rel="noopener" className="text-cyan underline">
            /adhesion
          </a>
          ) arrivent ici automatiquement avec leur numéro d&apos;adhérent.
        </p>
      </div>

      <AdhesionQrPanel />

      <div className="toolbar-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className="input-field pl-9"
            placeholder="Nom, email, adresse, ville…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(q);
            }}
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button
            variant={onlyEligible ? "secondary" : "ghost"}
            className="w-full sm:w-auto"
            onClick={() => setOnlyEligible((v) => !v)}
          >
            Avant-première (≥{AVANT_PREMIERE_MIN_VISITS})
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => load(q)}
          >
            Chercher
          </Button>
          <a href="/api/members/export" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full">
              <Download size={16} /> Export CSV
            </Button>
          </a>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => void openNotify()}
          >
            <Mail size={16} /> Envoyer une info
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus size={16} /> Nouvel adhérent
          </Button>
        </div>
      </div>

      <button
        type="button"
        className="text-left text-sm text-cyan underline-offset-2 hover:underline"
        onClick={() => setTermsOpen((v) => !v)}
      >
        {termsOpen ? "Masquer" : "Voir"} les conditions d’adhésion (v
        {MEMBERSHIP_TERMS_VERSION})
      </button>

      {termsOpen ? (
        <div className="panel max-h-[28rem] overflow-y-auto p-4 text-sm leading-relaxed text-[#c9d7ea]">
          <h3 className="font-display text-base font-semibold text-white">
            {MEMBERSHIP_TERMS_TITLE}
          </h3>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm">
            {MEMBERSHIP_TERMS_BODY}
          </pre>
        </div>
      ) : null}

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {members.length ? (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Passages</th>
                <th className="px-4 py-3">Coordonnées</th>
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Cotisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m._id}
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/5"
                  onClick={() => void openDetail(m)}
                >
                  <td className="px-4 py-3 font-medium">
                    {m.full_name || <span className="text-muted">(sans nom)</span>}
                    {m.member_number ? (
                      <span className="block font-mono text-xs text-cyan">{m.member_number}</span>
                    ) : null}
                    {m.signup_source && m.signup_source !== "dashboard" ? (
                      <span className="block text-xs text-muted">via {m.signup_source}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">
                      {m.visits_count ?? 0}
                    </span>
                    {m.is_avant_premiere_eligible ? (
                      <span className="mt-1 block text-xs text-cyan">
                        Éligible avant-première
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-muted">
                        {(m.visits_count ?? 0) < AVANT_PREMIERE_MIN_VISITS
                          ? `${AVANT_PREMIERE_MIN_VISITS - (m.visits_count ?? 0)} avant éligibilité`
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {m.email}
                    <br />
                    {m.phone || "—"}
                    <br />
                    <span className="text-xs">
                      Infos : {m.consent_communications ? "✅" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {m.address_line || m.city ? (
                      <>
                        {m.address_line}
                        <br />
                        {m.postal_code} {m.city}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.membership_fee_amount}&nbsp;€
                    <br />
                    <span className="text-xs text-muted">
                      {m.is_fee_paid ? "Payée" : "À régler"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: `${MEMBERSHIP_STATUS_COLORS[m.membership_status]}22`,
                        color: MEMBERSHIP_STATUS_COLORS[m.membership_status],
                      }}
                    >
                      {MEMBERSHIP_STATUS_LABELS[m.membership_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil size={14} /> Modifier
                      </Button>
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        disabled={
                          busy ||
                          !m.email ||
                          !(m.full_name || (m.first_name && m.last_name))
                        }
                        onClick={() => void sendCard(m)}
                        title={
                          !m.email
                            ? "Email manquant"
                            : !(m.full_name || (m.first_name && m.last_name))
                              ? "Prénom / nom manquants"
                              : "Renvoyer la carte par email"
                        }
                      >
                        <Mail size={14} /> Carte
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        disabled={busy}
                        onClick={() => void deleteMember(m)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Aucun adhérent"
          description="Ajoute la première adhésion — 5 € et acceptation des conditions."
        >
          <Button onClick={openCreate}>Nouvel adhérent</Button>
        </EmptyState>
      )}

      {detailBusy ? (
        <p className="text-sm text-muted">Ouverture de la fiche…</p>
      ) : null}

      {detail ? (
        <div className="modal-sheet" onClick={() => setDetail(null)}>
          <div
            className="modal-panel max-h-[90vh] max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {detail.member.full_name || "Adhérent"}
                </h3>
                {detail.member.member_number ? (
                  <p className="mt-1 font-mono text-sm text-cyan">
                    {detail.member.member_number}
                  </p>
                ) : null}
              </div>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Fermer
              </Button>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <p>
                <span className="text-muted">Email · </span>
                {detail.member.email || "—"}
              </p>
              <p>
                <span className="text-muted">Tél · </span>
                {detail.member.phone || "—"}
              </p>
              <p>
                <span className="text-muted">Adresse · </span>
                {[
                  detail.member.address_line,
                  [detail.member.postal_code, detail.member.city]
                    .filter(Boolean)
                    .join(" "),
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
              <p>
                <span className="text-muted">Adhérent depuis · </span>
                {frDate(detail.member.joined_at?.slice(0, 10) || null)}
              </p>
              <p>
                <span className="text-muted">Passages · </span>
                <b className="text-white">{detail.visits_count}</b>
                {detail.is_avant_premiere_eligible ? (
                  <span className="ml-2 text-xs text-cyan">
                    · éligible avant-première
                  </span>
                ) : null}
              </p>
              {detail.member.internal_notes ? (
                <p className="rounded-xl bg-black/20 p-3 text-muted">
                  Notes · {detail.member.internal_notes}
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  openEdit(detail.member);
                  setDetail(null);
                }}
              >
                <Pencil size={14} /> Modifier
              </Button>
              <Button
                variant="ghost"
                disabled={
                  busy ||
                  !detail.member.email ||
                  !(
                    detail.member.full_name ||
                    (detail.member.first_name && detail.member.last_name)
                  )
                }
                onClick={() => void sendCard(detail.member)}
              >
                <Mail size={14} /> Carte
              </Button>
            </div>

            <h4 className="mt-6 font-display text-base font-semibold">
              Historique des soirées
            </h4>
            <p className="mt-1 text-xs text-muted">
              « Présent » = pointé à l’entrée. « Confirmée » = réservé mais pas
              encore venu / pas pointé.
            </p>

            {detail.history.length ? (
              <ul className="mt-3 space-y-2">
                {detail.history.map((h) => (
                  <li
                    key={h._id}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{h.show_title}</p>
                        <p className="text-xs text-muted">
                          {frDate(h.show_date)}
                          {h.start_time ? ` · ${h.start_time}` : ""}
                          {` · ${h.seats_count} place${h.seats_count > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${STATUS_VISIT_COLORS[h.reservation_status]}22`,
                          color: STATUS_VISIT_COLORS[h.reservation_status],
                        }}
                      >
                        {h.did_attend
                          ? "Venu ✓"
                          : SEAT_RESERVATION_STATUS_LABELS[h.reservation_status]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Aucune réservation liée pour l’instant.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="modal-sheet">
          <div className="modal-panel max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold">
              {editingId ? "Modifier l’adhérent" : "Nouvelle adhésion"}
            </h3>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="label-field">Nom complet *</label>
                <input
                  className="input-field"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-field">Email *</label>
                  <input
                    className="input-field"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Téléphone</label>
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Adresse *</label>
                <input
                  className="input-field"
                  placeholder="N° et rue"
                  value={form.address_line}
                  onChange={(e) =>
                    setForm({ ...form, address_line: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-field">Code postal *</label>
                  <input
                    className="input-field"
                    value={form.postal_code}
                    onChange={(e) =>
                      setForm({ ...form, postal_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Ville *</label>
                  <input
                    className="input-field"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-field">
                    Cotisation (€) — 5 € 1ʳᵉ fois
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    min={0}
                    step={1}
                    value={form.membership_fee_amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        membership_fee_amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Statut</label>
                  <select
                    className="input-field"
                    value={form.membership_status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        membership_status: e.target
                          .value as MembershipStatus,
                      })
                    }
                  >
                    {(
                      Object.keys(MEMBERSHIP_STATUS_LABELS) as MembershipStatus[]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {MEMBERSHIP_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.is_fee_paid}
                  onChange={(e) =>
                    setForm({ ...form, is_fee_paid: e.target.checked })
                  }
                />
                <span>Cotisation réglée ({form.membership_fee_amount}&nbsp;€)</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.consent_communications}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      consent_communications: e.target.checked,
                    })
                  }
                />
                <span>Accepte de recevoir les infos de l’association</span>
              </label>
              {!editingId ? (
                <label className="flex items-start gap-2 rounded-xl border border-cyan/20 bg-cyan/5 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.accepted_terms}
                    onChange={(e) =>
                      setForm({ ...form, accepted_terms: e.target.checked })
                    }
                  />
                  <span>
                    J’accepte les{" "}
                    <button
                      type="button"
                      className="text-cyan underline"
                      onClick={() => setTermsOpen(true)}
                    >
                      conditions d’adhésion
                    </button>{" "}
                    (v{MEMBERSHIP_TERMS_VERSION}) et les statuts de
                    l’association. *
                  </span>
                </label>
              ) : null}
              <div>
                <label className="label-field">Notes internes</label>
                <textarea
                  className="input-field min-h-[72px]"
                  value={form.internal_notes}
                  onChange={(e) =>
                    setForm({ ...form, internal_notes: e.target.value })
                  }
                />
              </div>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-300">{error}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                }}
              >
                Annuler
              </Button>
              <Button disabled={busy} onClick={() => void saveMember()}>
                {busy ? "…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {notifyOpen ? (
        <div className="modal-sheet">
          <div className="modal-panel max-h-[90vh] max-w-lg overflow-y-auto">
            <h3 className="font-display text-lg font-semibold">
              Envoyer une info aux adhérents
            </h3>
            <p className="mt-1 text-sm text-muted">
              Filtre l’audience, coche qui reçoit, puis envoie. Uniquement les
              actifs avec email + consentement infos.
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="label-field">Destinataires</label>
                <select
                  className="input-field"
                  value={notifyAudience}
                  onChange={(e) =>
                    applyNotifyAudience(e.target.value as NotifyAudience)
                  }
                  disabled={notifyLoading}
                >
                  {(Object.keys(NOTIFY_AUDIENCE_LABELS) as NotifyAudience[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {NOTIFY_AUDIENCE_LABELS[key]}
                        {notifyPool.length
                          ? ` — ${filterNotifyAudience(notifyPool, key).length}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted">
                    {notifyLoading
                      ? "Chargement…"
                      : `${notifySelected.length} sélectionné${
                          notifySelected.length > 1 ? "s" : ""
                        } / ${notifyRecipients.length} dans le filtre`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-cyan underline"
                      onClick={selectAllNotify}
                      disabled={notifyLoading || !notifyRecipients.length}
                    >
                      Tout cocher
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted underline"
                      onClick={clearNotifySelection}
                      disabled={notifyLoading || !notifySelected.length}
                    >
                      Tout décocher
                    </button>
                  </div>
                </div>
                <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {notifyLoading ? (
                    <li className="text-sm text-muted">…</li>
                  ) : notifyRecipients.length === 0 ? (
                    <li className="text-sm text-muted">
                      Personne dans ce filtre.
                    </li>
                  ) : (
                    notifyRecipients.map((m) => {
                      const checked = notifySelected.includes(m._id);
                      return (
                        <li key={m._id}>
                          <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={checked}
                              onChange={() => toggleNotifyMember(m._id)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-white">
                                {m.full_name}
                                {m.member_number ? (
                                  <span className="ml-1 text-xs text-muted">
                                    {m.member_number}
                                  </span>
                                ) : null}
                              </span>
                              <span className="block truncate text-xs text-muted">
                                {m.email} · {m.visits_count ?? 0} passage
                                {(m.visits_count ?? 0) > 1 ? "s" : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>
                {notifySelectedMembers.length > 0 &&
                notifySelectedMembers.length <= 8 ? (
                  <p className="mt-2 text-xs text-muted">
                    →{" "}
                    {notifySelectedMembers
                      .map((m) => m.full_name.split(" ")[0] || m.full_name)
                      .join(", ")}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="label-field">Objet</label>
                <input
                  className="input-field"
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  placeholder="Ex. Prochaine soirée au Biiip"
                />
              </div>
              <div>
                <label className="label-field">Message</label>
                <textarea
                  className="input-field min-h-[120px]"
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="Ton message…"
                />
              </div>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-300">{error}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setNotifyOpen(false)}>
                Annuler
              </Button>
              <Button
                disabled={
                  busy ||
                  notifyLoading ||
                  !notifySelected.length ||
                  !notifySubject.trim() ||
                  !notifyMessage.trim()
                }
                onClick={() => void sendNotify()}
              >
                <Mail size={16} />
                {busy
                  ? "Envoi…"
                  : `Envoyer (${notifySelected.length})`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
