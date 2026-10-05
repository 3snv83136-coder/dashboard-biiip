import { formatShowDate, formatTime } from "@/lib/club-format";
import { SHOW_TYPE_LABELS, VENUE_ADDRESS_LINE, VENUE_CITY, VENUE_NAME, VENUE_POSTAL_CODE } from "@/lib/constants";
import { getSeatsReserved, getShow, isShowBookable } from "@/lib/public-store";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReserveForm } from "./ReserveForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const show = await getShow(params.id);
  return { title: show ? `${show.title} — Biiip Comedy Club` : "Soirée — Biiip Comedy Club" };
}

export default async function ShowPage({ params }: { params: { id: string } }) {
  const show = await getShow(params.id);
  if (!show || !isShowBookable(show)) notFound();

  const cap = Number(show.capacity) || 19;
  const left = Math.max(0, cap - (await getSeatsReserved(show._id)));
  const pct = Math.round(((cap - left) / cap) * 100);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComedyEvent",
    name: show.title,
    startDate: `${show.show_date}T${show.start_time || "20:30"}:00`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    location: {
      "@type": "Place",
      name: VENUE_NAME,
      address: {
        "@type": "PostalAddress",
        streetAddress: VENUE_ADDRESS_LINE,
        postalCode: VENUE_POSTAL_CODE,
        addressLocality: VENUE_CITY,
        addressCountry: "FR",
      },
    },
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "EUR",
      availability: left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/spectacles" className="club-sub" style={{ display: "inline-block", marginTop: 0 }}>
        ‹ Programmation
      </Link>
      <div className="club-show" style={{ minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <h2 style={{ fontSize: 28 }}>{show.title}</h2>
        <div className="club-cyan" style={{ marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          {(SHOW_TYPE_LABELS[show.show_type] ?? "Soirée").toUpperCase()}
        </div>
      </div>
      <div className="club-chips">
        <span className="club-chip">{formatShowDate(show.show_date)}</span>
        <span className="club-chip">{formatTime(show.start_time)}</span>
        <span className="club-chip free">Gratuit</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
        <span className="club-blue">
          {left === 0 ? "Complet" : `${left} place${left > 1 ? "s" : ""} restante${left > 1 ? "s" : ""}`}
        </span>
        <div className="club-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <span style={{ color: "var(--c-muted)" }}>/{cap}</span>
      </div>

      {left === 0 ? (
        <p className="club-sub" style={{ marginTop: 24 }}>
          Cette soirée est complète.{" "}
          <Link href="/spectacles" className="club-link">
            Voir les autres dates
          </Link>
        </p>
      ) : (
        <ReserveForm showId={show._id} seatsLeft={left} />
      )}
    </>
  );
}
