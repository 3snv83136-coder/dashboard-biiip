"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function MaFicheLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [forgot, setForgot] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function loginWithCode(raw: string) {
    const access_code = raw.replace(/\D/g, "").slice(0, 4);
    if (access_code.length < 4) {
      setError("Code incorrect");
      return false;
    }
    const res = await fetch("/api/artist-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", access_code }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Code incorrect");
      return false;
    }
    router.replace("/ma-fiche/formulaire");
    return true;
  }

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/artist-portal");
      const json = await res.json();
      if (json.authenticated) {
        router.replace("/ma-fiche/formulaire");
        return;
      }

      const fromQr = (searchParams.get("code") || "")
        .replace(/\D/g, "")
        .slice(0, 4);
      if (fromQr.length === 4) {
        setCode(fromQr);
        setAutoBusy(true);
        setError("");
        await loginWithCode(fromQr);
        setAutoBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    await loginWithCode(code);
    setBusy(false);
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
            <p className="spectacle-sub">
              {autoBusy
                ? "Connexion via QR…"
                : "Entre ton code ou flash le QR du Biiip"}
            </p>
          </div>

          {autoBusy ? (
            <p className="text-center text-sm text-white/70">Un instant…</p>
          ) : !forgot ? (
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

export default function MaFicheLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="spectacle-shell">
          <p className="text-center text-white/70">Chargement…</p>
        </div>
      }
    >
      <MaFicheLoginInner />
    </Suspense>
  );
}
