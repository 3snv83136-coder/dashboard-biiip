"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@biiip.local");
  const [password, setPassword] = useState("biiip2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants incorrects. On réessaie ?");
      return;
    }
    router.push(params.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-md space-y-4 p-6 md:p-8">
      <div>
        <p className="font-display text-3xl font-bold">
          Biiip<span className="text-neon">.</span>
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold">Connexion</h1>
        <p className="mt-1 text-sm text-muted">
          Back-office interne — gérant, équipe & artistes.
        </p>
      </div>

      <div>
        <label className="label-field" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input-field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label-field" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          className="input-field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-neon">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connexion…" : "Entrer dans la cave"}
      </Button>

      <div className="rounded-xl bg-black/20 p-3 text-xs text-muted">
        <p className="mb-1 font-semibold text-white/80">Comptes démo</p>
        <p>admin@biiip.local · staff@biiip.local · leo@biiip.local</p>
        <p>Mot de passe : biiip2026</p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
