"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  MEMBERSHIP_STATUS_COLORS,
  MEMBERSHIP_STATUS_LABELS,
} from "@/lib/constants";
import {
  DEFAULT_MEMBERSHIP_FEE_AMOUNT,
  MEMBERSHIP_TERMS_BODY,
  MEMBERSHIP_TERMS_TITLE,
  MEMBERSHIP_TERMS_VERSION,
} from "@/lib/membership-terms";
import type { Member, MembershipStatus } from "@/lib/types";
import {
  Download,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (query = "") => {
    const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    setMembers(json.members ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function sendNotify() {
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
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json.error || "Envoi impossible"));
      }
      setNotifyOpen(false);
      setNotifySubject("");
      setNotifyMessage("");
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
          Registre association — nom, adresse, email. Cotisation{" "}
          {DEFAULT_MEMBERSHIP_FEE_AMOUNT}&nbsp;€ à la 1ʳᵉ adhésion. Utile pour
          les infos club et le cadre de vente de boissons à faible degré.
        </p>
      </div>

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
            onClick={() => setNotifyOpen(true)}
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
                <th className="px-4 py-3">Coordonnées</th>
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Cotisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{m.full_name}</td>
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
                    {m.address_line}
                    <br />
                    {m.postal_code} {m.city}
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil size={14} /> Modifier
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
          <div className="modal-panel">
            <h3 className="font-display text-lg font-semibold">
              Envoyer une info aux adhérents
            </h3>
            <p className="mt-1 text-sm text-muted">
              Email aux membres actifs ayant consenti aux communications.
            </p>
            <div className="mt-4 grid gap-3">
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
                  className="input-field min-h-[140px]"
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
              <Button disabled={busy} onClick={() => void sendNotify()}>
                <Mail size={16} />
                {busy ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
