import { sendReservationEmail, sendWelcomeEmail } from "@/lib/club-emails";
import { publicOrigin } from "@/lib/club-format";
import {
  clientIp,
  findMemberByEmail,
  findMemberByNumber,
  getShow,
  isValidEmail,
  joinAsMember,
  normalizeEmail,
  normalizeMemberNumber,
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
  const rawMemberNumber = String(body.member_number || "").trim();

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
    let member_number: string | null = null;
    const wantsMembership = body.join_club === true;

    // 1) N° adhérent saisi (fortement recommandé)
    if (rawMemberNumber) {
      const byNum = await findMemberByNumber(rawMemberNumber);
      if (!byNum) {
        return NextResponse.json(
          {
            error:
              "Ce numéro d’adhérent est introuvable. Vérifie-le sur ta carte (BIIIP-000123) ou laisse le champ vide.",
          },
          { status: 400 }
        );
      }
      member_id = byNum._id;
      member_number = byNum.member_number || normalizeMemberNumber(rawMemberNumber);
    }

    // 2) Lookup auto par email si déjà adhérent
    if (!member_id) {
      const byEmail = await findMemberByEmail(email);
      if (byEmail) {
        member_id = byEmail._id;
        member_number = byEmail.member_number || null;
      }
    }

    // 3) Nouvelle adhésion via case « J’adhère »
    if (wantsMembership && !member_id) {
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
      member_number = member.member_number || null;
      if (is_new) {
        await sendWelcomeEmail(member, `${origin}/adhesion/carte/${member._id}`);
      }
    }

    const result = await reserveSeats({
      show_id,
      full_name,
      email,
      seats_count,
      has_requested_membership: wantsMembership || Boolean(member_id),
      member_id,
      member_number,
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
    return NextResponse.json({
      ok: true,
      is_new: result.is_new,
      ticket_path,
      member_number,
    });
  } catch (err) {
    console.error("[public/reservations]", err);
    return NextResponse.json(
      { error: "Petit souci technique. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
