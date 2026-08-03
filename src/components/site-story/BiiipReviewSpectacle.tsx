"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { SiteStory, SiteStoryFaq } from "@/lib/types";

type Props = {
  story: SiteStory;
  paragraphs: string[];
  youtubeId: string | null;
  isPreview: boolean;
};

export function BiiipReviewSpectacle({
  story,
  paragraphs,
  youtubeId,
  isPreview,
}: Props) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#020b1c] text-[#f5f5f7]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(233,69,96,0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0,217,255,0.08), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(30,94,255,0.12), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {isPreview && !story.is_published ? (
        <div className="relative z-20 bg-amber-500/25 px-4 py-2.5 text-center text-sm text-amber-50 backdrop-blur-sm">
          Aperçu brouillon — pas encore poussé sur le site
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(story.seo_json_ld),
        }}
      />

      <header className="relative z-10 min-h-[78vh] overflow-hidden">
        <div
          className="absolute inset-0 scale-105"
          style={{
            backgroundImage: story.photo_urls[0]
              ? `linear-gradient(180deg, rgba(2,11,28,0.25) 0%, rgba(2,11,28,0.55) 45%, rgba(2,11,28,0.97) 100%), url(${story.photo_urls[0]})`
              : "linear-gradient(160deg, #0a1f45 0%, #020b1c 70%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020b1c] to-transparent" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-4xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20">
          <p
            className="mb-4 text-sm tracking-[0.45em] text-[#00d9ff] sm:text-base"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            THE BIIIP REVIEW
          </p>
          <div className="mb-5 h-[2px] w-16 bg-[#e94560] shadow-[0_0_18px_rgba(233,69,96,0.7)]" />
          <h1
            className="max-w-3xl text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92] tracking-[0.02em] text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            {story.h1}
          </h1>
          <p
            className="mt-6 max-w-xl text-lg italic leading-relaxed text-[#c9d7ea] sm:text-xl"
            style={{ fontFamily: "var(--font-instrument), Georgia, serif" }}
          >
            {story.title_fr}
            {story.title_en ? ` — ${story.title_en}` : ""}
          </p>
          <p
            className="mt-5 text-xs tracking-[0.28em] text-[#9eb6d4]"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            PAR {story.author_name.toUpperCase()} · TOULON
          </p>
        </div>
      </header>

      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-6 sm:px-8 sm:pb-32">
        <div className="flex flex-col gap-10 sm:gap-14">
          {paragraphs.map((paragraph, i) => (
            <Reveal
              key={`p-${i}`}
              from={i % 2 === 0 ? "left" : "right"}
              delayMs={40}
            >
              <div className="relative rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-6 py-9 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:px-11 sm:py-12">
                <span
                  className="mb-5 block text-[0.7rem] tracking-[0.35em] text-[#e94560]"
                  style={{ fontFamily: "var(--font-bebas), sans-serif" }}
                >
                  ACTE {toRoman(i + 1)}
                </span>
                <p
                  className="text-[1.15rem] leading-[1.95] text-[#eef3fa] sm:text-[1.35rem] sm:leading-[2.05]"
                  style={{
                    fontFamily: "var(--font-instrument), Georgia, serif",
                  }}
                >
                  {paragraph}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {story.photo_urls.length > 0 ? (
          <section className="mt-16 sm:mt-24">
            <Reveal from="left">
              <h2
                className="mb-8 text-3xl tracking-[0.12em] text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                SUR SCÈNE
              </h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-7">
              {story.photo_urls.map((url, i) => (
                <Reveal
                  key={`${url.slice(0, 40)}-${i}`}
                  from={i % 2 === 0 ? "right" : "left"}
                >
                  <div
                    className={`relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 shadow-[0_24px_50px_rgba(0,0,0,0.45)] ${
                      i === 0 && story.photo_urls.length === 3
                        ? "sm:col-span-2 aspect-[21/9]"
                        : "aspect-[4/3]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${story.h1} — photo ${i + 1}`}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020b1c]/50 to-transparent" />
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {story.video_url ? (
          <section className="mt-16 sm:mt-24">
            <Reveal from="right">
              <h2
                className="mb-8 text-3xl tracking-[0.12em] text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                REPLAY
              </h2>
            </Reveal>
            <Reveal from="left">
              {youtubeId ? (
                <div className="aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-black shadow-cyan">
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
                  className="inline-flex rounded-2xl border border-[#00d9ff]/40 bg-[#00d9ff]/10 px-6 py-4 tracking-[0.2em] text-[#00d9ff]"
                  style={{ fontFamily: "var(--font-bebas), sans-serif" }}
                >
                  VOIR LA VIDÉO →
                </a>
              )}
            </Reveal>
          </section>
        ) : null}

        {story.faqs.length ? (
          <section className="mt-20 sm:mt-28">
            <Reveal from="left">
              <h2
                className="mb-3 text-3xl tracking-[0.12em] text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                FAQ
              </h2>
              <p
                className="mb-10 max-w-md text-base italic text-[#9eb6d4] sm:text-lg"
                style={{
                  fontFamily: "var(--font-instrument), Georgia, serif",
                }}
              >
                Les questions que la salle pose encore en sortant.
              </p>
            </Reveal>
            <div className="flex flex-col gap-7 sm:gap-8">
              {story.faqs.map((faq, i) => (
                <Reveal
                  key={`${faq.question}-${i}`}
                  from={i % 2 === 0 ? "right" : "left"}
                >
                  <FaqCard faq={faq} index={i} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        <Reveal from="left">
          <footer className="mt-20 border-t border-white/10 pt-12 sm:mt-28">
            <p
              className="text-base leading-relaxed text-[#9eb6d4] sm:text-lg"
              style={{
                fontFamily: "var(--font-instrument), Georgia, serif",
              }}
            >
              {story.about_org}
            </p>
            <a
              href="https://biiipcomedyclub.fr"
              className="mt-6 inline-block text-lg tracking-[0.2em] text-[#00d9ff] transition hover:text-white"
              style={{ fontFamily: "var(--font-bebas), sans-serif" }}
            >
              BIIIPCOMEDYCLUB.FR
            </a>
          </footer>
        </Reveal>
      </article>
    </main>
  );
}

function FaqCard({ faq, index }: { faq: SiteStoryFaq; index: number }) {
  return (
    <details className="group rounded-[1.75rem] border border-white/[0.1] bg-[#061833]/75 px-6 py-7 open:border-[#00d9ff]/35 open:bg-[#071c3c]/95 open:shadow-cyan sm:px-9 sm:py-8">
      <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-5">
          <span>
            <span
              className="mb-2 block text-[0.65rem] tracking-[0.3em] text-[#00d9ff]/80"
              style={{ fontFamily: "var(--font-bebas), sans-serif" }}
            >
              Q{String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="block text-xl leading-tight tracking-[0.04em] text-white sm:text-2xl"
              style={{ fontFamily: "var(--font-bebas), sans-serif" }}
            >
              {faq.question}
            </span>
          </span>
          <span
            className="mt-1 shrink-0 text-2xl text-[#e94560] transition duration-300 group-open:rotate-45"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            +
          </span>
        </span>
      </summary>
      <p
        className="mt-6 border-t border-white/10 pt-6 text-base leading-[1.9] text-[#c9d7ea] sm:text-lg sm:leading-[1.95]"
        style={{ fontFamily: "var(--font-instrument), Georgia, serif" }}
      >
        {faq.answer}
      </p>
    </details>
  );
}

function Reveal({
  children,
  from,
  delayMs = 0,
}: {
  children: ReactNode;
  from: "left" | "right";
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (reduced) {
      el.dataset.visible = "true";
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = "true";
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="review-reveal"
      style={
        {
          "--reveal-x": from === "left" ? "-3.5rem" : "3.5rem",
          transitionDelay: `${delayMs}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rest = n;
  let out = "";
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out || "I";
}
