import type { Artist } from "./types";

/** Complète les champs d'accès / profil pour les fiches anciennes. */
export function ensureArtistAccessFields(artist: Artist): Artist {
  return {
    ...artist,
    access_code: artist.access_code ?? "",
    access_code_updated_at: artist.access_code_updated_at ?? null,
    access_last_login_at: artist.access_last_login_at ?? null,
    access_profile_completed_at: artist.access_profile_completed_at ?? null,
    technical_needs: artist.technical_needs ?? "",
    dietary_notes: artist.dietary_notes ?? "",
    city: artist.city ?? "",
  };
}

/** Code simple à 4 chiffres (ex. 4827). */
export function generateArtistAccessCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export const ARTIST_PORTAL_COOKIE = "biiip_artist_portal";
