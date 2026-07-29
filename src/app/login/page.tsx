"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          autoComplete="username"
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
          autoComplete="current-password"
          required
        />
      </div>

      {error ? <p className="text-sm text-neon">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connexion…" : "Entrer dans la cave"}
      </Button>
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
