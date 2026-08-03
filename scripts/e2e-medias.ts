/**
 * Test E2E Médias (prod) : upload → preview IA → publish.
 * Usage: npx tsx scripts/e2e-medias.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const BASE = process.env.E2E_BASE || "https://dashboard-biiip.vercel.app";
const PIN = process.env.E2E_PIN || "1076";

function jarFrom(setCookies: string[]): string {
  return setCookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function main() {
  const cookieJar: string[] = [];

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfJson = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];
  cookieJar.push(...csrfCookies.map((c) => c.split(";")[0]));

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieJar.join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrfJson.csrfToken,
      password: PIN,
      callbackUrl: `${BASE}/medias`,
      json: "true",
    }),
    redirect: "manual",
  });
  const loginCookies = loginRes.headers.getSetCookie?.() ?? [];
  cookieJar.push(...loginCookies.map((c) => c.split(";")[0]));
  const cookie = jarFrom(cookieJar);
  console.log("1. login", loginRes.status);

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  const session = (await sessionRes.json()) as { user?: { role?: string } };
  if (!session.user) throw new Error("Session absente après login");
  console.log("2. session ok role=", session.user.role);

  const photoPath = resolve(__dirname, "../public/biiip-fond.jpg");
  const bytes = readFileSync(photoPath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: "image/jpeg" }),
    "biiip-fond.jpg"
  );

  const uploadRes = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  const uploadJson = (await uploadRes.json()) as {
    url?: string;
    error?: string;
  };
  console.log("3. upload", uploadRes.status, uploadJson.url ? "url=ok" : uploadJson.error);
  if (!uploadRes.ok || !uploadJson.url) throw new Error("Upload failed");

  const notes =
    "Plateau samedi au Biiip, salle pleine, Léo Mirage en tête d'affiche, ambiance cave voûtée, rires non-stop.";

  const t0 = Date.now();
  const previewRes = await fetch(`${BASE}/api/site-stories/preview`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notes,
      photo_urls: [uploadJson.url],
      video_url: "",
      show_id: null,
    }),
  });
  const previewJson = (await previewRes.json()) as {
    error?: string;
    preview_url?: string;
    public_path?: string;
    site_story?: { _id: string; h1: string; body_text: string };
    ai_status?: string;
    message?: string;
  };
  console.log(
    "4. preview",
    previewRes.status,
    `${Date.now() - t0}ms`,
    previewJson.ai_status || "",
    previewJson.error || previewJson.message || ""
  );
  if (!previewRes.ok || !previewJson.site_story) {
    throw new Error(previewJson.error || "Preview failed");
  }
  console.log("   h1:", previewJson.site_story.h1.slice(0, 80));
  console.log(
    "   body_len:",
    previewJson.site_story.body_text.length,
    "notes_len:",
    notes.length
  );

  const pubRes = await fetch(
    `${BASE}/api/site-stories/${previewJson.site_story._id}/publish`,
    { method: "POST", headers: { Cookie: cookie } }
  );
  const pubJson = (await pubRes.json()) as {
    error?: string;
    message?: string;
    public_path?: string;
  };
  console.log("5. publish", pubRes.status, pubJson.message || pubJson.error);
  if (!pubRes.ok) throw new Error(pubJson.error || "Publish failed");

  const pageUrl = `${BASE}${pubJson.public_path || previewJson.public_path}`;
  const pageRes = await fetch(pageUrl);
  console.log("6. page", pageRes.status, pageUrl);
  if (!pageRes.ok) throw new Error("Page not reachable");

  console.log("E2E OK");
}

main().catch((err) => {
  console.error("E2E FAIL", err instanceof Error ? err.message : err);
  process.exit(1);
});
