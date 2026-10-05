import { requireSession } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Diagnostic staff : est-ce que Brevo est configuré en prod ? */
export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const key = process.env.BREVO_API_KEY?.trim() || "";
  const sender = process.env.BREVO_SENDER_EMAIL?.trim() || "";
  return NextResponse.json({
    brevo_configured: Boolean(key),
    brevo_key_length: key.length,
    sender_email: sender || null,
    sender_fallback: sender ? null : "noreply@biiipcomedyclub.fr",
    hint: key
      ? "Clé présente — si les mails n’arrivent pas, vérifie que l’expéditeur est validé dans Brevo."
      : "BREVO_API_KEY absente sur cet environnement Vercel — les emails sont simulés.",
  });
}
