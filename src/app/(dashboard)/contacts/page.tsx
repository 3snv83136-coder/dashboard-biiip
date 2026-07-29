"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONTACT_SOURCE_LABELS } from "@/lib/constants";
import type { Contact, ContactSource } from "@/lib/types";
import { Download, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const empty = {
  full_name: "",
  email: "",
  phone: "",
  source: "manuel" as ContactSource,
  consent_marketing: true,
  tags: "",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = useCallback(async (query = "") => {
    const res = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    setContacts(json.contacts ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createContact() {
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm(empty);
    await load(q);
  }

  return (
    <div className="space-y-6">
      <div className="toolbar-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className="input-field pl-9"
            placeholder="Nom, email, téléphone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(q);
            }}
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => load(q)}>
            Chercher
          </Button>
          <a href="/api/contacts/export" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full">
              <Download size={16} /> Export CSV
            </Button>
          </a>
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus size={16} /> Ajouter un contact
          </Button>
        </div>
      </div>

      {contacts.length ? (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">RGPD</th>
                <th className="px-4 py-3">Tags</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c._id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{c.full_name}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.email}
                    <br />
                    {c.phone}
                  </td>
                  <td className="px-4 py-3">
                    {CONTACT_SOURCE_LABELS[c.source]}
                  </td>
                  <td className="px-4 py-3">
                    {c.consent_marketing ? "✅" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs text-cyan"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Fichier client vide"
          description="Ajoute un contact après la soirée — c’est 2 clics."
        >
          <Button onClick={() => setOpen(true)}>Ajouter un contact</Button>
        </EmptyState>
      )}

      {open ? (
        <div className="modal-sheet">
          <div className="modal-panel">
            <h3 className="font-display text-lg font-semibold">Nouveau contact</h3>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="label-field">Nom</label>
                <input
                  className="input-field"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Email</label>
                  <input
                    className="input-field"
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
                    placeholder="+33..."
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Source</label>
                <select
                  className="input-field"
                  value={form.source}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source: e.target.value as ContactSource,
                    })
                  }
                >
                  {Object.entries(CONTACT_SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Tags (séparés par des virgules)</label>
                <input
                  className="input-field"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.consent_marketing}
                  onChange={(e) =>
                    setForm({ ...form, consent_marketing: e.target.checked })
                  }
                />
                Consentement marketing (RGPD)
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createContact} disabled={!form.full_name}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
