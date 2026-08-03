import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { loadStore } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const store = await loadStore();
  const story = (store.site_stories ?? []).find((s) => s.slug === params.slug);
  if (!story || !story.is_published) return { title: "The Biiip Review" };
  return {
    title: `${story.title_en} · Biiip Comedy Club`,
    description: story.body_text.slice(0, 160),
    openGraph: {
      title: story.title_en,
      description: story.body_text.slice(0, 160),
      images: story.photo_urls.slice(0, 1),
    },
  };
}

export default async function TheBiiipReviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const store = await loadStore();
  const story = (store.site_stories ?? []).find((s) => s.slug === params.slug);
  if (!story || !story.is_published) notFound();

  const youtubeId = extractYoutubeId(story.video_url);

  return (
    <main className="min-h-screen bg-[#031029] text-[#f5f5f7]">
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
            {story.title_en}
          </h1>
          <p className="mt-2 text-sm text-[#9eb6d4]">{story.title_fr}</p>
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
                key={`${url}-${i}`}
                className={`relative overflow-hidden rounded-2xl bg-black/30 ${
                  i === 0 && story.photo_urls.length === 3
                    ? "sm:col-span-2 aspect-[21/9]"
                    : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={url}
                  alt={`${story.title_en} — photo ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </section>
        ) : null}

        {story.video_url ? (
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Watch
            </h2>
            {youtubeId ? (
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={story.title_en}
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
                Open video
              </a>
            )}
          </section>
        ) : null}

        <footer className="border-t border-white/10 pt-6 text-sm text-[#9eb6d4]">
          <p>Biiip Comedy Club — cave vaulted stage, Toulon.</p>
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
