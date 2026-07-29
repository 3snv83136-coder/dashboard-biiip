import { requireSession } from "@/lib/api-auth";
import { sendReviewSms } from "@/lib/brevo";
import { createId, nowIso } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { ReviewRequest, SendStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;
  return NextResponse.json({
    review_requests: getStore().review_requests.sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  const body = await req.json();
  const phone = String(body.phone || "").trim();
  if (!phone) {
    return NextResponse.json(
      { error: "Le numéro est obligatoire" },
      { status: 400 }
    );
  }

  const store = getStore();
  const ts = nowIso();
  const draft: ReviewRequest = {
    _id: createId("review"),
    contact_id: body.contact_id ? String(body.contact_id) : null,
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
    return NextResponse.json(
      {
        review_request: draft,
        error: e instanceof Error ? e.message : "Échec SMS",
      },
      { status: 502 }
    );
  }

  store.review_requests.push(draft);
  return NextResponse.json(
    { review_request: draft, message: "C'est envoyé 🎤" },
    { status: 201 }
  );
}
