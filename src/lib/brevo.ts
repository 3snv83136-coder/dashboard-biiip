import { DEFAULT_REVIEW_SMS_BODY } from "./constants";

export type EmailSendResult = {
  ok: boolean;
  simulated: boolean;
  brevo_configured: boolean;
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

export async function sendReviewSms(phone: string, message?: string) {
  return sendTransactionalSms(phone, message?.trim() || DEFAULT_REVIEW_SMS_BODY);
}

export async function sendTransactionalSms(phone: string, content: string) {
  const recipient = normalizePhoneE164(phone);
  const body = content.trim();
  const apiKey = process.env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    console.warn("[brevo] SMS simulé — BREVO_API_KEY absente");
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

export async function sendDocumentEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL?.trim() || "noreply@biiipcomedyclub.fr";

  if (!apiKey) {
    console.warn(
      "[brevo] Email simulé — BREVO_API_KEY absente. Destinataire:",
      to
    );
    return { ok: true, simulated: true, brevo_configured: false };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      // Brevo accepte api-key et x-api-key ; on envoie les deux pour compat.
      "api-key": apiKey,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: "Biiip Comedy Club",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[brevo] email failed", res.status, text, {
      to,
      senderEmail,
    });
    return {
      ok: false,
      simulated: false,
      brevo_configured: true,
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
    provider_message_id: String(data.messageId ?? ""),
  };
}
