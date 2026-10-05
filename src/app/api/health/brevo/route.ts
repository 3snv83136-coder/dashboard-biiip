import { requireSession } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function envVal(name: string): string {
  return (process.env[name] || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

/** Diagnostic staff : config Brevo email (SMTP vs API). */
export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const api = envVal("BREVO_API_KEY");
  const smtp =
    envVal("BREVO_SMTP_KEY") || (api.startsWith("xsmtpsib-") ? api : "");
  const http = api.startsWith("xkeysib-") ? api : "";
  const sender = envVal("BREVO_SENDER_EMAIL");
  const smtpLogin = envVal("BREVO_SMTP_LOGIN") || sender || null;

  const smtp_key_looks_valid =
    smtp.startsWith("xsmtpsib-") && smtp.length >= 40;
  const smtp_login_set = Boolean(envVal("BREVO_SMTP_LOGIN"));
  const login_domain = smtpLogin?.includes("@")
    ? smtpLogin.split("@").pop()
    : null;

  let hint = "Aucune clé. Ajoute BREVO_SMTP_KEY + BREVO_SMTP_LOGIN.";
  if (smtp) {
    if (!smtp_key_looks_valid) {
      hint = `BREVO_SMTP_KEY trop courte ou invalide (len=${smtp.length}). Régénère une clé SMTP dans Brevo → SMTP & API.`;
    } else if (!smtp_login_set) {
      hint =
        "Ajoute BREVO_SMTP_LOGIN = champ « Login » de Brevo SMTP & API (email ou ID@smtp-brevo.com).";
    } else if (login_domain === "smtp-relay.brevo.com") {
      hint =
        "BREVO_SMTP_LOGIN est le serveur, pas le login. Remplace par le champ Login de Brevo.";
    } else {
      hint =
        "Config SMTP présente. Si 535 : régénère la clé SMTP et vérifie que Login = exactement le champ Brevo.";
    }
  } else if (http) {
    hint =
      "API seule. Pour Vercel, préfère SMTP (BREVO_SMTP_KEY) ou désactive l’allowlist IP Brevo.";
  }

  return NextResponse.json({
    smtp_configured: Boolean(smtp),
    smtp_key_looks_valid,
    smtp_key_length: smtp ? smtp.length : 0,
    smtp_login_explicit: smtp_login_set,
    smtp_login_domain: login_domain,
    api_configured: Boolean(http),
    api_key_kind: http
      ? "xkeysib"
      : api.startsWith("xsmtpsib-")
        ? "xsmtpsib_WRONG_FOR_API"
        : api
          ? "unknown"
          : "none",
    sender_email: sender || null,
    smtp_login: smtpLogin,
    preferred_transport: smtp ? "smtp" : http ? "api" : "none",
    hint,
  });
}
