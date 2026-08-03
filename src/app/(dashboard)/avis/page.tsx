"use client";

import { Button } from "@/components/ui/Button";
import { DEFAULT_REVIEW_SMS_BODY } from "@/lib/constants";
import type { Contact, ReviewRequest } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

type SendMode = "contact" | "phone";

export default function AvisPage() {
  const [mode, setMode] = useState<SendMode>("contact");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(DEFAULT_REVIEW_SMS_BODY);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackOk, setFeedbackOk] = useState(true);
  const [busy, setBusy] = useState(false);

  const contactsWithPhone = useMemo(
    () =>
      contacts
        .filter((c) => Boolean(c.phone?.trim()))
        .sort((a, b) => a.full_name.localeCompare(b.full_name, "fr")),
    [contacts]
  );

  const selectedContact = useMemo(
    () => contactsWithPhone.find((c) => c._id === contactId) ?? null,
    [contactsWithPhone, contactId]
  );

  const contactById = useMemo(() => {
    const map = new Map(contacts.map((c) => [c._id, c]));
    return map;
  }, [contacts]);

  const load = useCallback(async () => {
    const [reqRes, contactRes] = await Promise.all([
      fetch("/api/review-requests"),
      fetch("/api/contacts"),
    ]);
    const reqJson = await reqRes.json();
    const contactJson = await contactRes.json();
    setRequests(reqJson.review_requests ?? []);
    setContacts(contactJson.contacts ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function switchMode(next: SendMode) {
    setMode(next);
    setFeedback("");
    if (next === "phone") {
      setContactId("");
    } else if (selectedContact) {
      setPhone(selectedContact.phone);
    }
  }

  function onSelectContact(id: string) {
    setContactId(id);
    const contact = contactsWithPhone.find((c) => c._id === id);
    if (contact) setPhone(contact.phone);
  }

  const canSend =
    mode === "contact"
      ? Boolean(contactId && selectedContact?.phone)
      : Boolean(phone.trim());

  async function sendSms() {
    setBusy(true);
    setFeedback("");

    const payload =
      mode === "contact" && selectedContact
        ? {
            contact_id: selectedContact._id,
            phone: selectedContact.phone,
            message_body: message,
          }
        : {
            contact_id: null,
            phone,
            message_body: message,
          };

    const res = await fetch("/api/review-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFeedbackOk(false);
      setFeedback(json.error || "Ça n'est pas passé. On réessaie ?");
      await load();
      return;
    }
    setFeedbackOk(true);
    setFeedback(json.message || "C'est envoyé 🎤");
    setPhone("");
    setContactId("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="panel max-w-xl space-y-4 p-5">
        <p className="text-sm text-muted">
          Envoie un SMS avec le lien d’avis Google — depuis un contact du fichier
          ou un numéro saisi à la main.
        </p>

        <div className="flex gap-2 rounded-xl bg-black/25 p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "contact"
                ? "bg-electric text-white"
                : "text-muted hover:text-white"
            }`}
            onClick={() => switchMode("contact")}
          >
            Contact existant
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "phone"
                ? "bg-electric text-white"
                : "text-muted hover:text-white"
            }`}
            onClick={() => switchMode("phone")}
          >
            Numéro libre
          </button>
        </div>

        {mode === "contact" ? (
          <div>
            <label className="label-field" htmlFor="avis-contact">
              Contact
            </label>
            <select
              id="avis-contact"
              className="input-field"
              value={contactId}
              onChange={(e) => onSelectContact(e.target.value)}
            >
              <option value="">Choisir un contact…</option>
              {contactsWithPhone.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.full_name} — {c.phone}
                </option>
              ))}
            </select>
            {contactsWithPhone.length === 0 ? (
              <p className="mt-2 text-xs text-warn">
                Aucun contact avec téléphone. Ajoute-en un dans Contacts.
              </p>
            ) : null}
            {selectedContact ? (
              <p className="mt-2 text-xs text-muted">
                SMS vers {selectedContact.full_name} ({selectedContact.phone})
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <label className="label-field" htmlFor="avis-phone">
              Téléphone
            </label>
            <input
              id="avis-phone"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06… ou +336…"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        )}

        <div>
          <label className="label-field" htmlFor="avis-message">
            Message
          </label>
          <textarea
            id="avis-message"
            className="input-field min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={sendSms} disabled={busy || !canSend}>
          {busy
            ? "Envoi…"
            : mode === "contact"
              ? "Envoyer au contact"
              : "Envoyer le SMS"}
        </Button>
        {feedback ? (
          <p className={`text-sm ${feedbackOk ? "text-success" : "text-neon"}`}>
            {feedback}
          </p>
        ) : null}
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Historique</h3>
        {requests.length ? (
          requests.map((r) => {
            const contact = r.contact_id
              ? contactById.get(r.contact_id)
              : undefined;
            return (
              <div key={r._id} className="panel p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {contact?.full_name || r.phone}
                    </p>
                    {contact ? (
                      <p className="text-xs text-muted">{r.phone}</p>
                    ) : null}
                  </div>
                  <span
                    className={
                      r.send_status === "sent"
                        ? "text-success"
                        : r.send_status === "failed"
                          ? "text-neon"
                          : "text-warn"
                    }
                  >
                    {r.send_status}
                  </span>
                </div>
                <p className="mt-2 text-muted">{r.message_body}</p>
                <p className="mt-2 text-xs text-muted">
                  {r.provider} · {r.provider_message_id || "—"} ·{" "}
                  {r.sent_at || r.created_at}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted">Aucun SMS envoyé pour l’instant.</p>
        )}
      </section>
    </div>
  );
}
