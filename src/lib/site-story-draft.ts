import {
  BIIIP_REVIEW_TITLE_EN,
  BIIIP_REVIEW_TITLE_FR,
  SHOW_TYPE_LABELS,
  VENUE_ABOUT,
  VENUE_CAPACITY,
  VENUE_FULL_ADDRESS,
  VENUE_NAME,
  VENUE_NEAR,
} from "@/lib/constants";
import type { Show, SiteStoryFaq } from "@/lib/types";

export type SiteStoryAiDraft = {
  title_en: string;
  title_fr: string;
  h1: string;
  slug: string;
  meta_description: string;
  body_text: string;
  faqs: SiteStoryFaq[];
  author_name: string;
  about_org: string;
  generated_by: "claude" | "manual";
};

/** FAQ adresse — toujours la vraie adresse du club. */
export const FAQ_LOCATION: SiteStoryFaq = {
  question: `Où se trouve le ${VENUE_NAME} ?`,
  answer: `Au ${VENUE_FULL_ADDRESS}, ${VENUE_NEAR}. Une cave voûtée intimiste de ${VENUE_CAPACITY} places seulement.`,
};

const LOCATION_Q =
  /o[uù]\s+se\s+trouve|adresse|o[uù]\s+est\s+(le\s+)?biiip|localis/i;

/** Corrige toute FAQ « où / adresse » avec l’adresse réelle. */
export function ensureFactualFaqs(faqs: SiteStoryFaq[]): SiteStoryFaq[] {
  const fixed = faqs.map((faq) =>
    LOCATION_Q.test(faq.question)
      ? { ...faq, answer: FAQ_LOCATION.answer }
      : faq
  );
  const hasLocation = fixed.some((f) => LOCATION_Q.test(f.question));
  if (!hasLocation) {
    return [FAQ_LOCATION, ...fixed].slice(0, 5);
  }
  return fixed;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(items: T[], seed: number, count: number): T[] {
  if (items.length === 0) return [];
  const out: T[] = [];
  let s = seed;
  const pool = [...items];
  while (out.length < count && pool.length) {
    s = (s * 1103515245 + 12345) >>> 0;
    const i = s % pool.length;
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/** FAQ neuves à chaque génération, liées aux notes / à la soirée. */
export function buildContextualFaqs(
  notes: string,
  show?: Show | null,
  seedExtra = Date.now()
): SiteStoryFaq[] {
  const theme = notes.trim() || show?.title || "soirée stand-up";
  const seed = hashSeed(`${theme}|${show?._id || ""}|${seedExtra}`);
  const showLabel = show
    ? `${show.title} (${SHOW_TYPE_LABELS[show.show_type]})`
    : null;

  const linked: SiteStoryFaq[] = [
    {
      question: `De quoi parle cet avis du Biiip ?`,
      answer: `Il revient sur « ${theme.slice(0, 120)} » — l’ambiance ressentie depuis la salle de ${VENUE_CAPACITY} places, collée à la scène.`,
    },
    {
      question: `Pourquoi le Biiip reste-t-il intimiste ?`,
      answer: `La jauge est volontairement limitée à ${VENUE_CAPACITY} places : chaque punchline arrive sans filtre, et le public fait vraiment partie du set.`,
    },
    {
      question: `Comment réserver une place au Biiip ?`,
      answer: `La billetterie est sur Billetweb via biiipcomedyclub.fr — le club n’encaisse pas en ligne dans le dashboard.`,
    },
    {
      question: `C’est quoi L’avis du Biiip ?`,
      answer: `Notre regard éditorial après une soirée live : ce qui a fait rire, l’énergie de la cave, et ce qu’on retient sous la voûte.`,
    },
    {
      question: `Le Biiip convient-il pour une première en stand-up ?`,
      answer: `Oui — format court, proximité totale avec les artistes, et une salle où l’on entend chaque réaction. Idéal pour découvrir le live à Toulon.`,
    },
    {
      question: `Y a-t-il un bar sur place ?`,
      answer: `Oui, l’expérience Biiip mêle stand-up et moment convivial autour d’un verre, dans la cave au ${VENUE_FULL_ADDRESS}.`,
    },
  ];

  if (showLabel) {
    linked.unshift({
      question: `Quel type de soirée est évoqué ici ?`,
      answer: `Cet avis s’appuie sur ${showLabel} du ${show!.show_date} — format live au ${VENUE_NAME}.`,
    });
  }

  // Indices tirés des notes (mots > 4 lettres)
  const words = theme
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4)
    .slice(0, 8);
  for (const w of words.slice(0, 2)) {
    linked.push({
      question: `Qu’est-ce qui ressort autour de « ${w} » dans cette soirée ?`,
      answer: `Les notes de l’équipe mettent en avant « ${w} » : c’est ce fil qui traverse l’ambiance décrite dans L’avis du Biiip.`,
    });
  }

  const chosen = pick(linked, seed, 3);
  // Adresse réelle toujours présente (1 FAQ factuelle)
  return ensureFactualFaqs([FAQ_LOCATION, ...chosen]).slice(0, 4);
}

/** Corps enrichi — jamais un simple collage des notes. */
export function buildEnrichedBody(
  notes: string,
  show?: Show | null
): string {
  const raw = notes.trim();
  const hook = raw
    ? raw.length > 160
      ? raw.slice(0, 157).trim() + "…"
      : raw
    : "une soirée stand-up où la salle a vraiment répondu";

  const showBit = show
    ? `On revient sur ${show.title} (${show.show_date}, ${SHOW_TYPE_LABELS[show.show_type]}).`
    : `Pas de fiche soirée liée : on part des notes de l’équipe pour raconter le live.`;

  return [
    `Au ${VENUE_NAME}, cave voûtée de ${VENUE_CAPACITY} places au ${VENUE_FULL_ADDRESS}, la proximité n’est pas un slogan : tu es assez près pour sentir le set arriver.`,
    showBit,
    `Ce que l’équipe a retenu — « ${hook} » — donne le ton : rires qui rebondissent sous la voûte, public collé à la scène, zéro filet.`,
    `Les sets restent serrés, les réactions sont vraies, et l’intimité fait le reste. C’est exactement pour ça que le Biiip existe à Toulon.`,
    `Si tu cherches une soirée stand-up où l’on se souvient des punchlines autant que des visages autour, la cave du Biiip (${VENUE_NEAR}) est faite pour ça.`,
  ].join("\n\n");
}

export function localSiteStoryDraft(
  notes: string,
  show?: Show | null,
  seedExtra = Date.now()
): SiteStoryAiDraft {
  const theme =
    notes.trim() || show?.title || "une soirée stand-up pleine d'énergie";
  const h1 = show
    ? `${show.title} — vu du Biiip Comedy Club`
    : `Au Biiip : ${theme.slice(0, 56)}`;

  return {
    title_en: BIIIP_REVIEW_TITLE_EN,
    title_fr: BIIIP_REVIEW_TITLE_FR,
    h1,
    slug: "",
    meta_description:
      `L'avis du Biiip — ${theme.slice(0, 80)}. Cave voûtée, ${VENUE_CAPACITY} places, ${VENUE_FULL_ADDRESS}.`.slice(
        0,
        160
      ),
    body_text: buildEnrichedBody(notes, show),
    faqs: buildContextualFaqs(notes, show, seedExtra),
    author_name: "Rédaction Biiip Comedy Club",
    about_org: VENUE_ABOUT,
    generated_by: "manual",
  };
}
