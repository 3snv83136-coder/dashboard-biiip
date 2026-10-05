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
  const smtpLogin =
    process.env.BREVO_SMTP_LOGIN?.trim() || sender || null;

  const smtp_key_looks_valid =
    smtp.startsWith("xsmtpsib-") && smtp.length >= 40;
  const smtp_login_set = Boolean(process.env.BREVO_SMTP_LOGIN?.trim());

  let hint =
    "Aucune clé. Ajoute BREVO_SMTP_KEY (xsmtpsib-…) et BREVO_SMTP_LOGIN.";
  if (smtp) {
    if (!smtp_key_looks_valid) {
      hint =
        "BREVO_SMTP_KEY semble tronquée ou invalide (doit commencer par xsmtpsib- et faire ~60+ caractères).";
    } else if (!smtp_login_set) {
      hint =
        "SMTP prêt, mais BREVO_SMTP_LOGIN n’est pas défini : on utilise BREVO_SENDER_EMAIL. Si 535 Authentication failed → mets le login SMTP exact de Brevo (SMTP & API), souvent l’email du compte.";
    } else {
      hint =
        "SMTP prêt — les emails ne dépendent plus de l’allowlist IP Brevo.";
    }
  } else if (http) {
    hint =
      "API seule : risque de 401 IP sur Vercel. Ajoute BREVO_SMTP_KEY (xsmtpsib-…).";
  }

  return NextResponse.json({
    smtp_configured: Boolean(smtp),
    smtp_key_looks_valid,
    smtp_key_length: smtp ? smtp.length : 0,
    smtp_login_explicit: smtp_login_set,
    api_configured: Boolean(http),
    sender_email: sender || null,
    smtp_login: smtpLogin,
    preferred_transport: smtp ? "smtp" : http ? "api" : "none",
    hint,
  });
}
