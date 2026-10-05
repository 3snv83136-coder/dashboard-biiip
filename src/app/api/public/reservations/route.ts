import { sendReservationEmail, sendWelcomeEmail } from "@/lib/club-emails";
import { publicOrigin } from "@/lib/club-format";
import {
  clientIp,
  getShow,
  isValidEmail,
  joinAsMember,
  normalizeEmail,
  rateLimited,
  reserveSeats,
} from "@/lib/public-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_SEATS = 4;

/** Réservation gratuite d'une soirée. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (String(body.website || "").trim()) {
    return NextResponse.json({ ok: true, ticket_path: "/spectacles" });
  }
  if (rateLimited(`resa:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  const show_id = String(body.show_id || "");
  const full_name = String(body.full_name || "").trim();
  const email = normalizeEmail(String(body.email || ""));
  const seats_count = Math.floor(Number(body.seats_count));

  if (!full_name || full_name.length > 120) {
    return NextResponse.json({ error: "Indique ton nom." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Cet email ne semble pas valide." }, { status: 400 });
  }
  if (!Number.isFinite(seats_count) || seats_count < 1 || seats_count > MAX_SEATS) {
    return NextResponse.json({ error: `Choisis entre 1 et ${MAX_SEATS} places.` }, { status: 400 });
  }
  if (body.accepted_terms !== true) {
    return NextResponse.json(
      { error: "Coche la case pour accepter les conditions de réservation." },
      { status: 400 }
    );
  }

  try {
    const origin = publicOrigin(req);
    let member_id: string | null = null;
    const wantsMembership = body.join_club === true;
    if (wantsMembership) {
      const parts = full_name.split(/\s+/).filter(Boolean);
      const first_name = parts[0] || full_name;
      const last_name = parts.slice(1).join(" ") || first_name;
      const { member, is_new } = await joinAsMember({
        email,
        first_name,
        last_name,
        consent_communications: false,
        signup_source: "reservation",
      });
      member_id = member._id;
      if (is_new) await sendWelcomeEmail(member, `${origin}/adhesion/carte/${member._id}`);
    }

    const result = await reserveSeats({
      show_id,
      full_name,
      email,
      seats_count,
      has_requested_membership: wantsMembership,
      member_id,
    });

    if (!result.ok) {
      const msg =
        result.reason === "full"
          ? "Désolé, il ne reste plus assez de places pour cette soirée."
          : result.reason === "closed"
          ? "Les réservations sont fermées pour cette soirée."
          : "Soirée introuvable.";
      return NextResponse.json({ error: msg, reason: result.reason }, { status: 409 });
    }

    const ticket_path = `/spectacles/billet/${result.reservation._id}`;
    if (result.is_new) {
      const show = await getShow(show_id);
      if (show) await sendReservationEmail(result.reservation, show, `${origin}${ticket_path}`);
    }
    return NextResponse.json({ ok: true, is_new: result.is_new, ticket_path });
  } catch (err) {
    console.error("[public/reservations]", err);
    return NextResponse.json(
      { error: "Petit souci technique. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
