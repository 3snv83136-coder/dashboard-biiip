import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BiiipReviewSpectacle } from "@/components/site-story/BiiipReviewSpectacle";
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
    <BiiipReviewSpectacle
      story={story}
      paragraphs={paragraphs}
      youtubeId={youtubeId}
      isPreview={preview}
    />
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
