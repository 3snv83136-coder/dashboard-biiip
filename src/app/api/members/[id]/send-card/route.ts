import { requireSession } from "@/lib/api-auth";
import { sendWelcomeEmail } from "@/lib/club-emails";
import { publicOrigin } from "@/lib/club-format";
import { findMemberById } from "@/lib/public-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Renvoie la carte d'adhérent par email (staff). */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const member = await findMemberById(params.id);
  if (!member) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
  }
  if (!member.email) {
    return NextResponse.json(
      { error: "Cet adhérent n’a pas d’email" },
      { status: 400 }
    );
  }

  const cardUrl = `${publicOrigin(req)}/adhesion/carte/${member._id}`;
  const result = await sendWelcomeEmail(member, cardUrl);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error || "Envoi Brevo impossible",
        brevo_configured: result.brevo_configured,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    simulated: result.simulated,
    email: member.email,
    message: result.simulated
      ? "BREVO_API_KEY absente — email simulé (pas réellement envoyé)"
      : `Carte envoyée à ${member.email} ✅`,
  });
}
