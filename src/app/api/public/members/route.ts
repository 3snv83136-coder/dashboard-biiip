import { sendWelcomeEmail } from "@/lib/club-emails";
import { publicOrigin } from "@/lib/club-format";
import {
  clientIp,
  isValidEmail,
  joinAsMember,
  normalizeEmail,
  rateLimited,
} from "@/lib/public-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Adhésion gratuite publique (formulaire QR code). */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Honeypot : un humain ne remplit jamais ce champ invisible.
  if (String(body.website || "").trim()) {
    return NextResponse.json({ ok: true, card_path: "/adhesion" });
  }
  if (rateLimited(`join:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  const email = normalizeEmail(String(body.email || ""));
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Cet email ne semble pas valide." }, { status: 400 });
  }
  if (body.accepted_terms !== true) {
    return NextResponse.json(
      { error: "Coche la case pour accepter les conditions d'adhésion." },
      { status: 400 }
    );
  }

  try {
    const { member, is_new } = await joinAsMember({
      email,
      consent_communications: body.consent_communications === true,
      signup_source: String(body.signup_source || "site").replace(/[^a-z0-9-]/gi, ""),
    });
    const card_path = `/adhesion/carte/${member._id}`;

    // Toujours tenter l'envoi de la carte (nouvel adhérent OU réinscription).
    // Rate-limit email pour éviter le spam si quelqu'un recharge.
    let email_status: "sent" | "simulated" | "skipped" | "failed" = "skipped";
    let email_error: string | null = null;
    const mailKey = `join-mail:${email}`;
    if (!rateLimited(mailKey, 3, 60 * 60 * 1000)) {
      const mail = await sendWelcomeEmail(
        member,
        `${publicOrigin(req)}${card_path}`
      );
      if (mail.ok && mail.simulated) email_status = "simulated";
      else if (mail.ok) email_status = "sent";
      else {
        email_status = "failed";
        email_error = mail.error || "Envoi impossible";
      }
    }

    return NextResponse.json({
      ok: true,
      is_new,
      card_path,
      email_status,
      email_error,
    });
  } catch (err) {
    console.error("[public/members]", err);
    return NextResponse.json(
      { error: "Petit souci technique. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
