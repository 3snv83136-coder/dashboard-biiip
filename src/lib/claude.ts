import type { Artist, DocType, Show } from "./types";
import {
  DOC_TYPE_LABELS,
  SHOW_TYPE_LABELS,
  VENUE_ABOUT,
  VENUE_CAPACITY,
  VENUE_FULL_ADDRESS,
  VENUE_NAME,
  VENUE_NEAR,
} from "./constants";
import {
  ensureFactualFaqs,
  localSiteStoryDraft,
  type SiteStoryAiDraft,
} from "./site-story-draft";

export type { SiteStoryAiDraft };
export { localSiteStoryDraft };

/** Un seul modèle rapide — enchaîner plusieurs modèles = timeout Vercel Hobby (~10s). */
const CLAUDE_FAST = "claude-haiku-4-5-20251001";
const CLAUDE_FALLBACK = "claude-sonnet-4-5";

async function callClaude(params: {
  prompt: string;
  max_tokens: number;
  timeout_ms?: number;
  /** Si true : un seul essai haiku (génération Médias). */
  fast?: boolean;
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const timeoutMs = params.timeout_ms ?? 5_000;
  const models = params.fast
    ? [CLAUDE_FAST]
    : [CLAUDE_FAST, CLAUDE_FALLBACK];

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: params.max_tokens,
          messages: [{ role: "user", content: params.prompt }],
        }),
      });

      if (!res.ok) {
        console.error("anthropic", model, res.status, await res.text());
        if (params.fast) return null;
        continue;
      }

      const data = (await res.json()) as {
        content: Array<{ type: string; text?: string }>;
      };
      const text = data.content.find((c) => c.type === "text")?.text ?? "";
      if (text.trim()) return text;
    } catch (err) {
      console.error("anthropic error", model, err);
      if (params.fast) return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function generateDocumentContent(params: {
  doc_type: DocType;
  show: Show;
  artist: Artist;
}): Promise<{ content: string; generated_by: "claude" | "manual" }> {
  const { doc_type, show, artist } = params;

  const prompt = `Tu es l'assistant du Biiip Comedy Club (cave voûtée, 19 places, Toulon).
Génère un document "${DOC_TYPE_LABELS[doc_type]}" en français, pro et chaleureux.
Soirée : ${show.title} — ${show.show_date} à ${show.start_time} (${SHOW_TYPE_LABELS[show.show_type]}).
Artiste : ${artist.stage_name} (${artist.legal_name}). Bio : ${artist.bio || "n/a"}.
Cachet habituel : ${artist.default_fee_amount}€.
Réponds uniquement avec le contenu du document en markdown.`;

  const text = await callClaude({ prompt, max_tokens: 900 });
  if (text) return { content: text, generated_by: "claude" };

  return {
    content: localTemplate(doc_type, show, artist),
    generated_by: "manual",
  };
}

export async function generateSiteStoryContent(params: {
  notes: string;
  show?: Show | null;
  has_photo: boolean;
  has_video: boolean;
}): Promise<SiteStoryAiDraft> {
  const { notes, show, has_photo, has_video } = params;
  const showLine = show
    ? `Soirée liée : ${show.title} — ${show.show_date} à ${show.start_time} (${SHOW_TYPE_LABELS[show.show_type]}).`
    : "Pas de soirée liée.";
  const staffText = notes.trim() || "soirée stand-up live au Biiip";

  const prompt = `Tu es le rédacteur éditorial du ${VENUE_NAME} (${VENUE_FULL_ADDRESS}, cave de ${VENUE_CAPACITY} places, ${VENUE_NEAR}).

MISSION : transformer les NOTES STAFF en un VRAI long article (L'avis du Biiip), très étoffé.
INTERDIT : recopier les notes telles quelles, paragraphes courts d'1-2 phrases, inventer une autre adresse.

NOTES STAFF:
"""${staffText}"""
${showLine}
Médias : photo=${has_photo ? "oui" : "non"} · vidéo=${has_video ? "oui" : "non"}

RÈGLES body_text (OBLIGATOIRE) :
- Exactement 5 ou 6 paragraphes LONGS, séparés par \\n\\n
- Chaque paragraphe = 4 à 7 phrases (environ 80 à 140 mots) — jamais un paragraphe maigre
- Parle de Toulon, du stand-up live, de l'intimité de la cave, du public, des punchlines
- Amplifie et développe les NOTES STAFF (ambiance, détails, sensations) sans les coller brutes
- Ton chaleureux, cinéma, direct — pas de jargon SEO creux
- Minimum ~900 mots au total pour body_text

RÈGLES faqs (exactement 4) :
- QUESTIONS NOUVELLES, liées à ces notes / cette soirée
- Une FAQ « Où se trouve le Biiip Comedy Club ? » avec adresse EXACTE : ${VENUE_FULL_ADDRESS}
- Les 3 autres FAQ parlent du contenu de l'avis

about_org = "${VENUE_ABOUT}"

JSON UNIQUEMENT :
{"title_en":"The Biiip Review","title_fr":"L'avis du Biiip","h1":"...","slug":"kebab-case","meta_description":"...max 155 car","body_text":"para1\\n\\npara2\\n\\npara3\\n\\npara4\\n\\npara5","faqs":[{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}],"author_name":"Rédaction Biiip Comedy Club","about_org":"${VENUE_ABOUT}"}`;

  const text = await callClaude({
    prompt,
    max_tokens: 2800,
    timeout_ms: 7_500,
    fast: true,
  });
  if (text) {
    const parsed = parseStoryJson(text);
    if (parsed) {
      const paras = parsed.body_text.split(/\n\n+/).filter(Boolean);
      const bodyTooThin =
        paras.length < 4 ||
        parsed.body_text.trim().length < 900 ||
        paras.some((p) => p.trim().length < 120);
      const copiedNotes =
        Boolean(notes.trim()) &&
        normalizeCmp(parsed.body_text) === normalizeCmp(notes);

      if (copiedNotes || bodyTooThin) {
        return localSiteStoryDraft(notes, show);
      }

      return {
        ...parsed,
        faqs: ensureFactualFaqs(parsed.faqs),
        about_org: VENUE_ABOUT,
        generated_by: "claude",
      };
    }
  }

  return localSiteStoryDraft(notes, show);
}

function normalizeCmp(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function parseStoryJson(
  raw: string
): Omit<SiteStoryAiDraft, "generated_by"> | null {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as Partial<SiteStoryAiDraft>;
    const faqs = ensureFactualFaqs(
      Array.isArray(data.faqs)
        ? data.faqs
            .map((f) => ({
              question: String(f?.question || "").trim(),
              answer: String(f?.answer || "").trim(),
            }))
            .filter((f) => f.question && f.answer)
            .slice(0, 6)
        : []
    );
    if (!data.h1 || !data.body_text || faqs.length < 1) return null;

    const body_text = String(data.body_text)
      .replace(/\r\n/g, "\n")
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n\n");

    return {
      title_en: String(data.title_en || "The Biiip Review").trim(),
      title_fr: String(data.title_fr || "L'avis du Biiip").trim(),
      h1: String(data.h1).trim(),
      slug: String(data.slug || "").trim(),
      meta_description: String(data.meta_description || "")
        .trim()
        .slice(0, 160),
      body_text,
      faqs,
      author_name: String(
        data.author_name || "Rédaction Biiip Comedy Club"
      ).trim(),
      about_org: VENUE_ABOUT,
    };
  } catch {
    return null;
  }
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
