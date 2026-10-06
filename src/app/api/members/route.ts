import { requireSession } from "@/lib/api-auth";
import { AVANT_PREMIERE_MIN_VISITS } from "@/lib/constants";
import {
  DEFAULT_MEMBERSHIP_FEE_AMOUNT,
  MEMBERSHIP_TERMS_VERSION,
} from "@/lib/membership-terms";
import { createId, nowIso } from "@/lib/ids";
import { getVisitsCountMap, nextMemberNumber } from "@/lib/public-store";
import { loadStore, saveStore } from "@/lib/store";
import type { MembershipStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const status = searchParams.get("status") || "";
  const eligible = searchParams.get("eligible_avant_premiere") === "1";

  const store = await loadStore();
  let members = store.members ?? [];
  if (q) {
    members = members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.address_line.toLowerCase().includes(q) ||
        (m.member_number || "").toLowerCase().includes(q)
    );
  }
  if (status) {
    members = members.filter((m) => m.membership_status === status);
  }

  const visits = await getVisitsCountMap(members.map((m) => m._id));
  let rows = members
    .map((m) => ({
      ...m,
      visits_count: visits[m._id] ?? 0,
      is_avant_premiere_eligible:
        (visits[m._id] ?? 0) >= AVANT_PREMIERE_MIN_VISITS,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  if (eligible) {
    rows = rows.filter((m) => m.is_avant_premiere_eligible);
  }

  return NextResponse.json({
    members: rows,
    terms_version: MEMBERSHIP_TERMS_VERSION,
    default_fee_amount: DEFAULT_MEMBERSHIP_FEE_AMOUNT,
    avant_premiere_min_visits: AVANT_PREMIERE_MIN_VISITS,
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(["admin", "staff"]);
  if (gate.error || !gate.session) return gate.error;

  const body = await req.json();
  const ts = nowIso();
  const accepted_terms = Boolean(body.accepted_terms);
  const is_fee_paid = Boolean(body.is_fee_paid);
  const fee = Number(body.membership_fee_amount);
  const membership_fee_amount = Number.isFinite(fee)
    ? fee
    : DEFAULT_MEMBERSHIP_FEE_AMOUNT;

  if (!accepted_terms) {
    return NextResponse.json(
      { error: "L’acceptation des conditions d’adhésion est obligatoire" },
      { status: 400 }
    );
  }

  const full_name = String(body.full_name || "").trim();
  const email = String(body.email || "").trim();
  const address_line = String(body.address_line || "").trim();
  const postal_code = String(body.postal_code || "").trim();
  const city = String(body.city || "").trim();

  if (!full_name || full_name.length < 2) {
    return NextResponse.json(
      { error: "Le nom est obligatoire" },
      { status: 400 }
    );
  }
  if (!email) {
    return NextResponse.json({ error: "L’email est obligatoire" }, { status: 400 });
  }

  // Adhésion gratuite : active dès l'enregistrement, sauf cotisation attendue.
  const membership_status: MembershipStatus =
    is_fee_paid || membership_fee_amount <= 0 ? "active" : "pending";

  const nameParts = full_name.split(/\s+/).filter(Boolean);
  const first_name = nameParts[0] || full_name;
  const last_name = nameParts.slice(1).join(" ") || "";

  const member = {
    _id: createId("member"),
    first_name,
    last_name,
    full_name,
    email,
    phone: String(body.phone || "").trim(),
    address_line,
    postal_code,
    city,
    membership_fee_amount,
    membership_status,
    is_fee_paid,
    fee_paid_at: is_fee_paid ? ts : null,
    accepted_terms: true,
    accepted_terms_at: ts,
    terms_version: MEMBERSHIP_TERMS_VERSION,
    consent_communications: Boolean(body.consent_communications ?? false),
    member_number: await nextMemberNumber(),
    signup_source: "dashboard",
    joined_at: ts,
    internal_notes: String(body.internal_notes || "").trim(),
    created_by: gate.session.user.id,
    created_at: ts,
    updated_at: ts,
  };

  const store = await loadStore();
  if (!store.members) store.members = [];
  store.members.push(member);
  await saveStore(store);
  return NextResponse.json({ member }, { status: 201 });
}
