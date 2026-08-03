import { requireSession } from "@/lib/api-auth";
import { normalizePhoneE164, sendReviewSms } from "@/lib/brevo";
import { createId, nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { ReviewRequest, SendStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;
  return NextResponse.json({
    review_requests: (await loadStore()).review_requests.sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  const body = await req.json();
  const store = await loadStore();

  const contactId = body.contact_id ? String(body.contact_id) : null;
  let phone = normalizePhoneE164(String(body.phone || ""));

  if (contactId) {
    const contact = store.contacts.find((c) => c._id === contactId);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact introuvable" },
        { status: 404 }
      );
    }
    if (!phone) {
      phone = normalizePhoneE164(contact.phone);
    }
  }

  if (!phone) {
    return NextResponse.json(
      { error: "Le numéro est obligatoire (saisie ou contact avec téléphone)" },
      { status: 400 }
    );
  }

  const ts = nowIso();
  const draft: ReviewRequest = {
    _id: createId("review"),
    contact_id: contactId,
    phone,
    message_body: "",
    send_status: "pending" as SendStatus,
    provider: "brevo",
    provider_message_id: "",
    sent_at: null,
    created_by: gate.session.user.id,
    created_at: ts,
  };

  try {
    const result = await sendReviewSms(phone, body.message_body);
    draft.message_body = result.message_body;
    draft.provider = result.provider;
    draft.provider_message_id = result.provider_message_id;
    draft.send_status = "sent";
    draft.sent_at = nowIso();
  } catch (e) {
    draft.message_body = String(body.message_body || "");
    draft.send_status = "failed";
    store.review_requests.push(draft);
    await saveStore(store);
    return NextResponse.json(
      {
        review_request: draft,
        error: e instanceof Error ? e.message : "Échec SMS",
      },
      { status: 502 }
    );
  }

  store.review_requests.push(draft);
  await saveStore(store);
  return NextResponse.json(
    { review_request: draft, message: "C'est envoyé 🎤" },
    { status: 201 }
  );
}
