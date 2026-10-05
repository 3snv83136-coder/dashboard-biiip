import nodemailer from "nodemailer";
import { DEFAULT_REVIEW_SMS_BODY } from "./constants";

export type EmailSendResult = {
  ok: boolean;
  simulated: boolean;
  brevo_configured: boolean;
  transport?: "smtp" | "api" | "none";
  error?: string;
  provider_message_id?: string;
};

/** Normalise un numéro FR vers E.164 (+33…). */
export function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.replace(/\D/g, "").length === 10) {
    return `+33${digits.replace(/\D/g, "").slice(1)}`;
  }
  if (digits.startsWith("+")) return digits;
  if (/^33\d{9}$/.test(digits.replace(/\D/g, ""))) {
    return `+${digits.replace(/\D/g, "")}`;
  }
  return digits;
}

/** Nettoie une valeur d’env (guillemets / espaces collés par erreur dans Vercel). */
function envVal(name: string): string {
  return (process.env[name] || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

/** Clé SMTP Brevo (xsmtpsib-…) — recommandée sur Vercel (pas de filtre IP). */
function smtpKey(): string {
  const dedicated = envVal("BREVO_SMTP_KEY");
  if (dedicated) return dedicated;
  const api = envVal("BREVO_API_KEY");
  if (api.startsWith("xsmtpsib-")) return api;
  return "";
}

/** Clé API HTTP Brevo (xkeysib-…) — SMS + API REST. */
function httpApiKey(): string {
  const api = envVal("BREVO_API_KEY");
  if (api.startsWith("xkeysib-")) return api;
  return "";
}

export async function sendReviewSms(phone: string, message?: string) {
  return sendTransactionalSms(phone, message?.trim() || DEFAULT_REVIEW_SMS_BODY);
}

export async function sendTransactionalSms(phone: string, content: string) {
  const recipient = normalizePhoneE164(phone);
  const body = content.trim();
  const apiKey = httpApiKey();

  if (!apiKey) {
    console.warn("[brevo] SMS simulé — clé API xkeysib absente");
    return {
      ok: true,
      simulated: true,
      provider: "brevo",
      provider_message_id: `sim_${Date.now()}`,
      message_body: body,
    };
  }

  const sender = (process.env.BREVO_SMS_SENDER ?? "BiiipComedy")
    .trim()
    .slice(0, 11);
  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      recipient,
      content: body,
      type: "transactional",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo SMS failed: ${text}`);
  }

  const data = (await res.json()) as { messageId?: string | number };
  return {
    ok: true,
    simulated: false,
    provider: "brevo",
    provider_message_id: String(data.messageId ?? ""),
    message_body: body,
  };
}

async function sendViaSmtp(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const pass = smtpKey();
  const senderEmail =
    envVal("BREVO_SENDER_EMAIL") || "noreply@biiipcomedyclub.fr";
  const smtpLogin = envVal("BREVO_SMTP_LOGIN") || senderEmail;

  if (!pass) {
    return {
      ok: false,
      simulated: false,
      brevo_configured: false,
      transport: "none",
      error: "BREVO_SMTP_KEY absente (clé xsmtpsib-…)",
    };
  }

  // Une vraie clé SMTP Brevo fait bien plus de 40 caractères.
  if (!pass.startsWith("xsmtpsib-") || pass.length < 40) {
    return {
      ok: false,
      simulated: false,
      brevo_configured: true,
      transport: "smtp",
      error: `BREVO_SMTP_KEY invalide (len=${pass.length}). Copie la clé SMTP complète depuis Brevo → SMTP & API (pas la clé API xkeysib).`,
    };
  }

  if (!smtpLogin.includes("@")) {
    return {
      ok: false,
      simulated: false,
      brevo_configured: true,
      transport: "smtp",
      error: `BREVO_SMTP_LOGIN invalide (« ${smtpLogin.slice(0, 40)} »). Copie le champ Login de Brevo → SMTP & API (email ou …@smtp-brevo.com).`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: smtpLogin, pass },
    });

    const info = await transporter.sendMail({
      from: `"Biiip Comedy Club" <${senderEmail}>`,
      to,
      subject,
      html: htmlContent,
    });

    return {
      ok: true,
      simulated: false,
      brevo_configured: true,
      transport: "smtp",
      provider_message_id: String(info.messageId || ""),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP error";
    console.error("[brevo] SMTP failed", message, {
      to,
      smtpLogin,
      key_len: pass.length,
    });
    const hint = /535|Authentication failed/i.test(message)
      ? ` — Login utilisé: ${smtpLogin} (clé len=${pass.length}). Dans Brevo → SMTP & API, copie exactement « Login » → BREVO_SMTP_LOGIN et génère une nouvelle clé SMTP → BREVO_SMTP_KEY, puis Redeploy.`
      : /525|Unauthorized IP|unrecognised IP|authorised_ips|authorized_ips/i.test(
            message
          )
        ? " — Brevo bloque l’IP Vercel. Va dans Brevo → Security → Authorised IPs et DÉSACTIVE la restriction (obligatoire avec Vercel : les IP changent)."
        : "";
    return {
      ok: false,
      simulated: false,
      brevo_configured: true,
      transport: "smtp",
      error: `Brevo SMTP: ${message.slice(0, 160)}${hint}`,
    };
  }
}

async function sendViaHttpApi(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const apiKey = httpApiKey();
  const senderEmail =
    envVal("BREVO_SENDER_EMAIL") || "noreply@biiipcomedyclub.fr";

  if (!apiKey) {
    return {
      ok: false,
      simulated: false,
      brevo_configured: false,
      transport: "none",
      error: "BREVO_API_KEY absente (clé xkeysib-…)",
    };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: "Biiip Comedy Club" },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[brevo] API failed", res.status, text, { to, senderEmail });
    return {
      ok: false,
      simulated: false,
      brevo_configured: true,
      transport: "api",
      error: `Brevo ${res.status}: ${text.slice(0, 280)}`,
    };
  }

  const data = (await res.json().catch(() => ({}))) as {
    messageId?: string | number;
  };
  return {
    ok: true,
    simulated: false,
    brevo_configured: true,
    transport: "api",
    provider_message_id: String(data.messageId ?? ""),
  };
}

/**
 * Envoi email : SMTP en priorité (évite le blocage IP Vercel sur l’API),
 * puis API HTTP en secours.
 */
export async function sendDocumentEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const hasSmtp = Boolean(smtpKey());
  const hasApi = Boolean(httpApiKey());

  if (!hasSmtp && !hasApi) {
    console.warn("[brevo] Email simulé — aucune clé Brevo. Destinataire:", to);
    return {
      ok: true,
      simulated: true,
      brevo_configured: false,
      transport: "none",
    };
  }

  // 1) SMTP d’abord (recommandé sur Vercel)
  if (hasSmtp) {
    const smtp = await sendViaSmtp(to, subject, htmlContent);
    if (smtp.ok) return smtp;
    console.warn("[brevo] SMTP échoué, tentative API…", smtp.error);
    if (!hasApi) return smtp;
  }

  // 2) API HTTP
  const api = await sendViaHttpApi(to, subject, htmlContent);
  if (api.ok) return api;

  // 3) Si API bloquée par IP et SMTP dispo, réessayer SMTP une fois
  if (
    hasSmtp &&
    /unrecognised IP|authorized_ips|authorised_ips/i.test(api.error || "")
  ) {
    console.warn("[brevo] API bloquée par IP — retry SMTP");
    return sendViaSmtp(to, subject, htmlContent);
  }

  return api;
}
