"use client";

import { Button } from "@/components/ui/Button";
import { GOOGLE_REVIEW_URL } from "@/lib/constants";
import type { ReviewRequest } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export default function AvisPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `Merci d'être passé au Biiip Comedy Club 🎤 Laisse-nous un avis ici : ${GOOGLE_REVIEW_URL}`
  );
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/review-requests");
    const json = await res.json();
    setRequests(json.review_requests ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendSms() {
    setBusy(true);
    setFeedback("");
    const res = await fetch("/api/review-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message_body: message }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFeedback(json.error || "Ça n'est pas passé. On réessaie ?");
      await load();
      return;
    }
    setFeedback(json.message || "C'est envoyé 🎤");
    setPhone("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="panel max-w-xl space-y-4 p-5">
        <p className="text-sm text-muted">
          Saisis un numéro, on envoie un SMS avec le lien d’avis Google. Sans clé
          Brevo, l’envoi est simulé (idéal en démo).
        </p>
        <div>
          <label className="label-field">Téléphone (E.164)</label>
          <input
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+336..."
          />
        </div>
        <div>
          <label className="label-field">Message</label>
          <textarea
            className="input-field min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={sendSms} disabled={busy || !phone}>
          {busy ? "Envoi…" : "Envoyer le SMS"}
        </Button>
        {feedback ? <p className="text-sm text-success">{feedback}</p> : null}
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Historique</h3>
        {requests.length ? (
          requests.map((r) => (
            <div key={r._id} className="panel p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{r.phone}</p>
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
          ))
        ) : (
          <p className="text-sm text-muted">Aucun SMS envoyé pour l’instant.</p>
        )}
      </section>
    </div>
  );
}
