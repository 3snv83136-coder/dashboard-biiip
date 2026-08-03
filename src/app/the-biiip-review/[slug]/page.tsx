import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { withStoryDefaults } from "@/lib/site-story";
import { loadStore } from "@/lib/store";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { preview?: string };
}): Promise<Metadata> {
  const store = await loadStore();
  const raw = (store.site_stories ?? []).find((s) => s.slug === params.slug);
  if (!raw) return { title: "The Biiip Review" };

  const canPreview = await canSeePreview(searchParams?.preview === "1");
  if (!raw.is_published && !canPreview) {
    return { title: "The Biiip Review" };
  }

  const story = withStoryDefaults(raw);
  return {
    title: `${story.h1} · Biiip Comedy Club`,
    description: story.meta_description,
    openGraph: {
      title: story.h1,
      description: story.meta_description,
      images: story.photo_urls.slice(0, 1),
    },
  };
}

export default async function TheBiiipReviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { preview?: string };
}) {
  const store = await loadStore();
  const raw = (store.site_stories ?? []).find((s) => s.slug === params.slug);
  if (!raw) notFound();

  const preview = searchParams?.preview === "1";
  const canPreview = await canSeePreview(preview);
  if (!raw.is_published && !canPreview) notFound();

  const story = withStoryDefaults(raw);
  const youtubeId = extractYoutubeId(story.video_url);
  const paragraphs = story.body_text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[#031029] text-[#f5f5f7]">
      {preview && !story.is_published ? (
        <div className="bg-amber-500/20 px-4 py-2 text-center text-sm text-amber-100">
          Aperçu brouillon — pas encore poussé sur le site
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(story.seo_json_ld),
        }}
      />

      <div
        className="relative min-h-[42vh] overflow-hidden"
        style={{
          backgroundImage: story.photo_urls[0]
            ? `linear-gradient(180deg, rgba(3,16,41,0.35), rgba(3,16,41,0.92)), url(${story.photo_urls[0]})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col justify-end px-5 pb-12 pt-24 sm:px-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#00d9ff]">
            Biiip Comedy Club · Toulon
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-syne)] text-4xl font-bold tracking-tight sm:text-5xl">
            {story.h1}
          </h1>
          <p className="mt-3 text-sm text-[#9eb6d4]">
            {story.title_en}
            {story.title_fr ? ` · ${story.title_fr}` : ""}
          </p>
          <p className="mt-4 text-xs text-[#9eb6d4]">
            Par {story.author_name}
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-8 sm:gap-10">
          {paragraphs.map((paragraph, i) => (
            <div
              key={`p-${i}`}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.035] px-6 py-8 shadow-[0_0_0_1px_rgba(0,217,255,0.04)] sm:px-10 sm:py-11"
            >
              <p className="text-base leading-[1.9] text-[#e8eef7] sm:text-lg sm:leading-[1.95]">
                {paragraph}
              </p>
            </div>
          ))}
        </div>

        {story.photo_urls.length > 0 ? (
          <section className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2">
            {story.photo_urls.map((url, i) => (
              <div
                key={`${url.slice(0, 40)}-${i}`}
                className={`relative overflow-hidden rounded-3xl bg-black/30 ${
                  i === 0 && story.photo_urls.length === 3
                    ? "sm:col-span-2 aspect-[21/9]"
                    : "aspect-[4/3]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${story.h1} — photo ${i + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ))}
          </section>
        ) : null}

        {story.video_url ? (
          <section className="mt-14 space-y-5 sm:mt-16">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight sm:text-2xl">
              Vidéo
            </h2>
            {youtubeId ? (
              <div className="aspect-video overflow-hidden rounded-3xl bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={story.h1}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={story.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-2xl border border-white/15 px-5 py-4 text-sm text-[#00d9ff]"
              >
                Voir la vidéo
              </a>
            )}
          </section>
        ) : null}

        {story.faqs.length ? (
          <section className="mt-16 space-y-8 sm:mt-20">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight sm:text-2xl">
              FAQ
            </h2>
            <div className="flex flex-col gap-6 sm:gap-7">
              {story.faqs.map((faq, i) => (
                <details
                  key={`${faq.question}-${i}`}
                  className="group rounded-3xl border border-white/[0.1] bg-[#061833]/80 px-6 py-6 open:border-[#00d9ff]/25 open:bg-[#071c3c] sm:px-8 sm:py-7"
                >
                  <summary className="cursor-pointer list-none font-[family-name:var(--font-syne)] text-base font-semibold leading-snug text-[#f5f5f7] marker:content-none [&::-webkit-details-marker]:hidden sm:text-lg">
                    <span className="flex items-start justify-between gap-4">
                      <span>{faq.question}</span>
                      <span className="mt-0.5 shrink-0 text-[#00d9ff] transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-[1.85] text-[#c9d7ea] sm:text-base sm:leading-[1.9]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="mt-16 border-t border-white/10 pt-10 text-sm leading-relaxed text-[#9eb6d4] sm:mt-20">
          <p>{story.about_org}</p>
          <a
            href="https://biiipcomedyclub.fr"
            className="mt-4 inline-block text-[#00d9ff] underline-offset-2 hover:underline"
          >
            biiipcomedyclub.fr
          </a>
        </footer>
      </article>
    </main>
  );
}

async function canSeePreview(wantPreview: boolean): Promise<boolean> {
  if (!wantPreview) return false;
  const session = await auth();
  const role = session?.user?.role;
  return role === "admin" || role === "staff";
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "") || null;
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}
