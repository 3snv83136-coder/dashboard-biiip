import type { MediaAsset } from "./types";

/** Génère le contenu llms.txt (format Markdown) à partir des médias publiés. */
export function buildLlmsTxt(mediaAssets: MediaAsset[]): string {
  const published = mediaAssets
    .filter((m) => m.is_published)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

  const lines = [
    "# Biiip Comedy Club",
    "",
    "> Cave voûtée de stand-up à Toulon (19 places). Photos et vidéos des soirées.",
    "",
    "## Médias",
  ];

  if (!published.length) {
    lines.push("", "Aucun média publié pour le moment.");
  } else {
    for (const m of published) {
      const label = m.title || m.caption || m.alt_text || "Média Biiip";
      const desc = m.caption && m.caption !== label ? `: ${m.caption}` : "";
      lines.push(`- [${label}](${m.file_url})${desc}`);
    }
  }

  return lines.join("\n") + "\n";
}
