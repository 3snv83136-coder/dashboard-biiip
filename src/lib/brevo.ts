import { GOOGLE_REVIEW_URL } from "./constants";

export async function sendReviewSms(phone: string, message?: string) {
  const body =
    message ??
    `Merci d'être passé au Biiip Comedy Club 🎤 Laisse-nous un avis ici : ${GOOGLE_REVIEW_URL}`;

  if (!process.env.BREVO_API_KEY) {
    return {
      ok: true,
      simulated: true,
      provider: "brevo",
      provider_message_id: `sim_${Date.now()}`,
      message_body: body,
    };
  }

  const sender = process.env.BREVO_SMS_SENDER ?? "Biiip";
  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      recipient: phone,
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
