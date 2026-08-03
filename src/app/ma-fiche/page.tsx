"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaFicheLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [forgot, setForgot] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/artist-portal");
      const json = await res.json();
      if (json.authenticated) router.replace("/ma-fiche/formulaire");
    })();
  }, [router]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/artist-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", access_code: code }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Code incorrect");
      return;
    }
    router.push("/ma-fiche/formulaire");
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/artist-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "forgot",
        email_or_phone: emailOrPhone,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Impossible pour le moment");
      return;
    }
    setOk(json.message || "C'est envoyé.");
  }

  return (
    <>
      <div className="spectacle-bg" aria-hidden />
      <div className="spectacle-stars" aria-hidden />
      <div className="spectacle-shell">
        <div className="spectacle-card space-y-5">
          <div>
            <h1 className="spectacle-title">Biiip</h1>
            <p className="spectacle-sub">Entre ton code pour remplir ta fiche</p>
          </div>

          {!forgot ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="spectacle-label" htmlFor="code">
                  Code
                </label>
                <input
                  id="code"
                  className="spectacle-input text-center text-2xl tracking-[0.35em]"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="1234"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
              {error ? <p className="spectacle-error">{error}</p> : null}
              <button className="spectacle-btn" type="submit" disabled={busy}>
                {busy ? "…" : "Continuer"}
              </button>
              <p className="text-center">
                <button
                  type="button"
                  className="spectacle-link"
                  onClick={() => {
                    setForgot(true);
                    setError("");
                    setOk("");
                  }}
                >
                  Code oublié ?
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={onForgot} className="space-y-4">
              <p className="text-center text-sm text-white/60">
                Email ou téléphone de ta fiche — on te renvoie un nouveau code.
              </p>
              <div>
                <label className="spectacle-label" htmlFor="recover">
                  Email ou téléphone
                </label>
                <input
                  id="recover"
                  className="spectacle-input"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="toi@email.com ou 06…"
                  required
                />
              </div>
              {error ? <p className="spectacle-error">{error}</p> : null}
              {ok ? <p className="spectacle-ok">{ok}</p> : null}
              <button className="spectacle-btn" type="submit" disabled={busy}>
                {busy ? "…" : "Recevoir un nouveau code"}
              </button>
              <p className="text-center">
                <button
                  type="button"
                  className="spectacle-link"
                  onClick={() => {
                    setForgot(false);
                    setError("");
                    setOk("");
                  }}
                >
                  ← Retour
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
