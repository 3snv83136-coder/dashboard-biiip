import type { Artist, DocType, Show } from "./types";
import { DOC_TYPE_LABELS, SHOW_TYPE_LABELS } from "./constants";

export async function generateDocumentContent(params: {
  doc_type: DocType;
  show: Show;
  artist: Artist;
}): Promise<{ content: string; generated_by: "claude" | "manual" }> {
  const { doc_type, show, artist } = params;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `Tu es l'assistant du Biiip Comedy Club (cave voûtée, 19 places, Toulon).
Génère un document "${DOC_TYPE_LABELS[doc_type]}" en français, pro et chaleureux.
Soirée : ${show.title} — ${show.show_date} à ${show.start_time} (${SHOW_TYPE_LABELS[show.show_type]}).
Artiste : ${artist.stage_name} (${artist.legal_name}). Bio : ${artist.bio || "n/a"}.
Cachet habituel : ${artist.default_fee_amount}€.
Réponds uniquement avec le contenu du document en markdown.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          content: Array<{ type: string; text?: string }>;
        };
        const text = data.content.find((c) => c.type === "text")?.text ?? "";
        if (text) return { content: text, generated_by: "claude" };
      }
    } catch {
      // fallback local
    }
  }

  return { content: localTemplate(doc_type, show, artist), generated_by: "manual" };
}

function localTemplate(doc_type: DocType, show: Show, artist: Artist): string {
  switch (doc_type) {
    case "conducteur":
      return `# Conducteur — ${show.title}

**Date** : ${show.show_date} · **Heure** : ${show.start_time}
**Type** : ${SHOW_TYPE_LABELS[show.show_type]} · **Jauge** : ${show.capacity}

## Déroulé
- Accueil public
- Passage : **${artist.stage_name}**
- Remerciements / bar

_Généré pour le Biiip Comedy Club — Toulon_`;
    case "portrait":
      return `# Portrait artiste — ${artist.stage_name}

**Nom civil** : ${artist.legal_name}
**Niveau** : ${artist.artist_level}

## Bio
${artist.bio || "À compléter."}

## Réseaux
- Instagram : ${artist.instagram_handle || "—"}
- TikTok : ${artist.tiktok_handle || "—"}`;
    case "contrat_guso":
      return `# Contrat / fiche GUSO — ${artist.legal_name}

**Nom de scène** : ${artist.stage_name}
**Soirée** : ${show.title} (${show.show_date})
**Cachet de référence** : ${artist.default_fee_amount} €

À compléter avec les mentions légales GUSO avant signature.`;
    case "fiche_technique":
      return `# Fiche technique — ${artist.stage_name}

**Soirée** : ${show.title} · ${show.show_date} ${show.start_time}

## Besoins
- Micro dynamique (SM58 ou équivalent)
- Retour scène simple
- Pas de vidéo / playback sauf demande contraire

## Contact artiste
${artist.email} · ${artist.phone}`;
  }
}
