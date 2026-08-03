import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ARTIST_PORTAL_COOKIE } from "./artist-access";

function secret() {
  return process.env.AUTH_SECRET || "dev-biiip-dashboard-secret-change-me";
}

export function createArtistPortalToken(artistId: string): string {
  const issued = Date.now().toString(36);
  const payload = `${artistId}.${issued}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyArtistPortalToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [artistId, issued, sig] = parts;
  if (!artistId || !issued || !sig) return null;
  const payload = `${artistId}.${issued}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  // 30 jours
  const issuedMs = parseInt(issued, 36);
  if (!Number.isFinite(issuedMs) || Date.now() - issuedMs > 30 * 24 * 60 * 60 * 1000) {
    return null;
  }
  return artistId;
}

export async function getArtistPortalArtistId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(ARTIST_PORTAL_COOKIE)?.value;
  if (!token) return null;
  return verifyArtistPortalToken(token);
}

export async function setArtistPortalCookie(artistId: string) {
  const jar = await cookies();
  jar.set(ARTIST_PORTAL_COOKIE, createArtistPortalToken(artistId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearArtistPortalCookie() {
  const jar = await cookies();
  jar.delete(ARTIST_PORTAL_COOKIE);
}
