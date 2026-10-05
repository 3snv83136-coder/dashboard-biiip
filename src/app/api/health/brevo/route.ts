import { requireSession } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Diagnostic staff : config Brevo email (SMTP vs API). */
export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const api = process.env.BREVO_API_KEY?.trim() || "";
  const smtp =
    process.env.BREVO_SMTP_KEY?.trim() ||
    (api.startsWith("xsmtpsib-") ? api : "");
  const http = api.startsWith("xkeysib-") ? api : "";
  const sender = process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const smtpLogin = process.env.BREVO_SMTP_LOGIN?.trim() || sender;

  return NextResponse.json({
    smtp_configured: Boolean(smtp),
    api_configured: Boolean(http),
    sender_email: sender || null,
    smtp_login: smtpLogin || null,
    preferred_transport: smtp ? "smtp" : http ? "api" : "none",
    hint: smtp
      ? "SMTP prêt — les emails ne dépendent plus de l’allowlist IP Brevo."
      : http
        ? "API seule : risque de 401 IP sur Vercel. Ajoute BREVO_SMTP_KEY (xsmtpsib-…)."
        : "Aucune clé. Ajoute BREVO_SMTP_KEY (xsmtpsib-…) et BREVO_SENDER_EMAIL.",
  });
}
