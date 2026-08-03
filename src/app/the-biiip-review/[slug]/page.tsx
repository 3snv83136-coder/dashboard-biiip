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
        <div className="mx-auto flex max-w-3xl flex-col justify-end px-5 pb-10 pt-24">
          <p className="text-xs uppercase tracking-[0.25em] text-[#00d9ff]">
            Biiip Comedy Club · Toulon
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold tracking-tight sm:text-5xl">
            {story.h1}
          </h1>
          <p className="mt-2 text-sm text-[#9eb6d4]">
            {story.title_en}
            {story.title_fr ? ` · ${story.title_fr}` : ""}
          </p>
          <p className="mt-3 text-xs text-[#9eb6d4]">
            Par {story.author_name}
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl space-y-10 px-5 py-10">
        <div className="whitespace-pre-wrap text-base leading-relaxed text-[#f5f5f7]/90">
          {story.body_text}
        </div>

        {story.photo_urls.length > 0 ? (
          <section className="grid gap-3 sm:grid-cols-2">
            {story.photo_urls.map((url, i) => (
              <div
                key={`${url.slice(0, 40)}-${i}`}
                className={`relative overflow-hidden rounded-2xl bg-black/30 ${
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
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Vidéo
            </h2>
            {youtubeId ? (
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
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
                className="inline-flex rounded-xl border border-white/15 px-4 py-3 text-sm text-[#00d9ff]"
              >
                Voir la vidéo
              </a>
            )}
          </section>
        ) : null}

        {story.faqs.length ? (
          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              FAQ
            </h2>
            <div className="space-y-3">
              {story.faqs.map((faq, i) => (
                <details
                  key={`${faq.question}-${i}`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <summary className="cursor-pointer font-medium">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[#c9d7ea]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="border-t border-white/10 pt-6 text-sm text-[#9eb6d4]">
          <p>{story.about_org}</p>
          <a
            href="https://biiipcomedyclub.fr"
            className="mt-2 inline-block text-[#00d9ff] underline-offset-2 hover:underline"
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
