import { PUBLIC_SITE_BASE, VENUE_ABOUT } from "@/lib/constants";
import type { SiteStory, SiteStoryFaq } from "@/lib/types";
import { ensureFactualFaqs } from "@/lib/site-story-draft";

export function normalizeFaqs(raw: unknown): SiteStoryFaq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      question: String((item as SiteStoryFaq)?.question || "").trim(),
      answer: String((item as SiteStoryFaq)?.answer || "").trim(),
    }))
    .filter((f) => f.question && f.answer)
    .slice(0, 8);
}

export function buildSiteStoryJsonLd(story: {
  h1: string;
  meta_description: string;
  body_text: string;
  photo_urls: string[];
  video_url: string;
  faqs: SiteStoryFaq[];
  author_name: string;
  about_org: string;
  site_target_url: string;
  published_at: string | null;
  created_at: string;
}): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: story.h1,
      description: story.meta_description,
      articleBody: story.body_text,
      author: {
        "@type": "Organization",
        name: story.author_name,
        description: story.about_org,
      },
      publisher: {
        "@type": "Organization",
        name: "Biiip Comedy Club",
        url: PUBLIC_SITE_BASE,
        description: story.about_org,
      },
      datePublished: story.published_at || story.created_at,
      image: story.photo_urls,
      mainEntityOfPage: story.site_target_url,
      inLanguage: "fr",
    },
  ];

  if (story.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: story.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  if (story.video_url) {
    graph.push({
      "@type": "VideoObject",
      name: story.h1,
      description: story.meta_description,
      contentUrl: story.video_url,
      embedUrl: story.video_url,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** Normalise les champs SEO manquants pour les anciennes stories. */
export function withStoryDefaults(story: SiteStory): SiteStory {
  const h1 = story.h1 || story.title_en || "The Biiip Review";
  const faqs = ensureFactualFaqs(story.faqs ?? []);
  const author_name = story.author_name || "Rédaction Biiip Comedy Club";
  const about_org = story.about_org || VENUE_ABOUT;
  const meta_description =
    story.meta_description || story.body_text.slice(0, 155);
  const seo_json_ld =
    story.seo_json_ld && Object.keys(story.seo_json_ld).length
      ? story.seo_json_ld
      : buildSiteStoryJsonLd({
          h1,
          meta_description,
          body_text: story.body_text,
          photo_urls: story.photo_urls,
          video_url: story.video_url,
          faqs,
          author_name,
          about_org,
          site_target_url: story.site_target_url,
          published_at: story.published_at,
          created_at: story.created_at,
        });

  return {
    ...story,
    h1,
    faqs,
    author_name,
    about_org,
    meta_description,
    seo_json_ld,
    generated_by: story.generated_by || "manual",
  };
}
