"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Code incorrect. On réessaie ?");
      return;
    }
    router.push(params.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="panel w-full max-w-sm space-y-5 p-6 md:p-8"
    >
      <div className="text-center">
        <p className="font-display text-4xl font-bold tracking-tight">
          Biiip<span className="text-neon">.</span>
        </p>
        <p className="mt-2 text-sm text-muted">Entre le code d’accès</p>
      </div>

      <div>
        <label className="label-field" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          className="input-field text-center text-2xl tracking-[0.35em]"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••"
          required
          autoFocus
        />
      </div>

      {error ? (
        <p className="text-center text-sm text-neon">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "…" : "Entrer"}
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
