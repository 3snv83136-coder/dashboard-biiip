import { requireSession } from "@/lib/api-auth";
import { sendDocumentEmail } from "@/lib/brevo";
import { loadStore } from "@/lib/store";
import { NextResponse } from "next/server";

/** Envoie une info aux adhérents (email via Brevo). */
export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const member_ids = Array.isArray(body.member_ids)
    ? body.member_ids.map(String)
    : [];
  const only_consent = body.only_consent !== false;

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Objet et message obligatoires" },
      { status: 400 }
    );
  }

  const store = await loadStore();
  let targets = store.members ?? [];
  if (member_ids.length) {
    const set = new Set(member_ids);
    targets = targets.filter((m) => set.has(m._id));
  } else {
    targets = targets.filter((m) => m.membership_status === "active");
  }
  if (only_consent) {
    targets = targets.filter((m) => m.consent_communications && m.email);
  } else {
    targets = targets.filter((m) => m.email);
  }

  if (!targets.length) {
    return NextResponse.json(
      { error: "Aucun adhérent à contacter (email / consentement)" },
      { status: 400 }
    );
  }

  const html = `<div style="font-family:sans-serif;line-height:1.6">
    <p>Hello,</p>
    <p>${message.replace(/\n/g, "<br/>")}</p>
    <p style="margin-top:24px;color:#666;font-size:13px">— Biiip Comedy Club · Toulon</p>
  </div>`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const m of targets) {
    try {
      await sendDocumentEmail(m.email, subject, html);
      sent += 1;
    } catch (err) {
      failed += 1;
      errors.push(
        `${m.email}: ${err instanceof Error ? err.message : "échec"}`
      );
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    sent,
    failed,
    total: targets.length,
    errors: errors.slice(0, 5),
    message:
      failed === 0
        ? `Envoyé à ${sent} adhérent${sent > 1 ? "s" : ""} ✅`
        : `Envoyé à ${sent}, ${failed} échec(s)`,
  });
}
