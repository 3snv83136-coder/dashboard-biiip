import { DEFAULT_REVIEW_SMS_BODY } from "./constants";

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

export async function sendReviewSms(phone: string, message?: string) {
  return sendTransactionalSms(phone, message?.trim() || DEFAULT_REVIEW_SMS_BODY);
}

export async function sendTransactionalSms(phone: string, content: string) {
  const recipient = normalizePhoneE164(phone);
  const body = content.trim();

  if (!process.env.BREVO_API_KEY) {
    return {
      ok: true,
      simulated: true,
      provider: "brevo",
      provider_message_id: `sim_${Date.now()}`,
      message_body: body,
    };
  }

  // Brevo : max 11 caractères alphanumériques (pas d'espace → "BiiipComedy")
  const sender = (process.env.BREVO_SMS_SENDER ?? "BiiipComedy")
    .trim()
    .slice(0, 11);
  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY.trim(),
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

export async function sendDocumentEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  if (!process.env.BREVO_API_KEY) {
    return { ok: true, simulated: true };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL ?? "noreply@biiipcomedyclub.fr",
        name: "Biiip Comedy Club",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo email failed: ${text}`);
  }

  return { ok: true, simulated: false };
}
