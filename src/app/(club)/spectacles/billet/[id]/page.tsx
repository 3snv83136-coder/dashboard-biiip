import { ClubLogo } from "@/components/club/ClubLogo";
import { formatLongDate, formatTime } from "@/lib/club-format";
import { VENUE_FULL_ADDRESS } from "@/lib/constants";
import { getReservationById, getShow } from "@/lib/public-store";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const metadata = { title: "Mon billet — Biiip Comedy Club" };

export default async function BilletPage({ params }: { params: { id: string } }) {
  const resa = await getReservationById(params.id);
  if (!resa) notFound();
  const show = await getShow(resa.show_id);
  if (!show) notFound();

  const cancelled = resa.reservation_status === "annulee";
  const qrSvg = await QRCode.toString(`BIIIP:${resa.ticket_code}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  return (
    <>
      <div className="club-center" style={{ marginTop: 10 }}>
        <div className="club-tick club-cyan">{cancelled ? "✕" : "✓"}</div>
        <h1 className="club-h1" style={{ marginTop: 16 }}>
          {cancelled ? "Réservation annulée" : "C'est réservé !"}
        </h1>
        <p className="club-sub">
          {cancelled ? "Cette réservation n'est plus valable." : "Confirmation envoyée par email."}
        </p>
      </div>

      <div className="club-card" style={{ borderColor: "var(--c-cyan)", boxShadow: "0 0 20px rgba(79,243,255,.35)" }}>
        <ClubLogo size={32} />
        <div className="club-card-role">Billet · Entrée gratuite</div>
        <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800 }}>{show.title}</div>
        <div className="club-row">
          <div>
            Date<b>{capitalize(formatLongDate(show.show_date))}</b>
          </div>
          <div style={{ textAlign: "right" }}>
            Heure<b>{formatTime(show.start_time)}</b>
          </div>
        </div>
        <div className="club-row">
          <div>
            Au nom de<b>{resa.full_name}</b>
          </div>
          <div style={{ textAlign: "right" }}>
            Places<b>{resa.seats_count}</b>
          </div>
        </div>
        {!cancelled ? (
          <div className="club-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        ) : null}
        <p className="club-center" style={{ marginTop: 10, fontSize: 13, color: "var(--c-muted)" }}>
          Code {resa.ticket_code}
        </p>
      </div>

      <p className="club-center club-sub" style={{ marginTop: 18, fontSize: 13 }}>
        {VENUE_FULL_ADDRESS}
        <br />
        Montre ce billet à l&apos;entrée.
      </p>
      <p className="club-center" style={{ marginTop: 20 }}>
        <Link href="/spectacles" className="club-btn-ghost">
          Autres soirées
        </Link>
      </p>
    </>
  );
}
