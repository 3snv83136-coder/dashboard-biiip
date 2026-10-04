/** Formatages FR pour les pages publiques. */
export function formatShowDate(show_date: string): string {
  const d = new Date(`${show_date}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  }).format(d);
}

export function formatLongDate(show_date: string): string {
  const d = new Date(`${show_date}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(d);
}

export function formatTime(start_time: string): string {
  return (start_time || "").replace(":", "h");
}

export function formatJoinDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(new Date(iso));
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Origine publique de l'app (pour les liens dans les emails). */
export function publicOrigin(req: Request): string {
  const env = process.env.PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}
