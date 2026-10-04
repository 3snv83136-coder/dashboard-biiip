import { requireSession } from "@/lib/api-auth";
import {
  DEFAULT_MEMBERSHIP_FEE_AMOUNT,
  MEMBERSHIP_TERMS_VERSION,
} from "@/lib/membership-terms";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import type { MembershipStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  if (!store.members) store.members = [];
  const member = store.members.find((m) => m._id === params.id);
  if (!member) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const ts = nowIso();

  if (body.full_name !== undefined) {
    member.full_name = String(body.full_name || "").trim();
  }
  if (body.email !== undefined) member.email = String(body.email || "").trim();
  if (body.phone !== undefined) member.phone = String(body.phone || "").trim();
  if (body.address_line !== undefined) {
    member.address_line = String(body.address_line || "").trim();
  }
  if (body.postal_code !== undefined) {
    member.postal_code = String(body.postal_code || "").trim();
  }
  if (body.city !== undefined) member.city = String(body.city || "").trim();
  if (body.internal_notes !== undefined) {
    member.internal_notes = String(body.internal_notes || "").trim();
  }
  if (body.consent_communications !== undefined) {
    member.consent_communications = Boolean(body.consent_communications);
  }
  if (body.membership_fee_amount !== undefined) {
    const fee = Number(body.membership_fee_amount);
    member.membership_fee_amount = Number.isFinite(fee)
      ? fee
      : DEFAULT_MEMBERSHIP_FEE_AMOUNT;
  }
  if (body.membership_status !== undefined) {
    member.membership_status = body.membership_status as MembershipStatus;
  }
  if (body.is_fee_paid !== undefined) {
    member.is_fee_paid = Boolean(body.is_fee_paid);
    if (member.is_fee_paid && !member.fee_paid_at) {
      member.fee_paid_at = ts;
    }
    if (!member.is_fee_paid) {
      member.fee_paid_at = null;
    }
    if (member.is_fee_paid && member.membership_status === "pending") {
      member.membership_status = "active";
    }
  }
  if (body.accepted_terms === true && !member.accepted_terms) {
    member.accepted_terms = true;
    member.accepted_terms_at = ts;
    member.terms_version = MEMBERSHIP_TERMS_VERSION;
  }

  member.updated_at = ts;
  await saveStore(store);
  return NextResponse.json({ member });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  if (!store.members) store.members = [];
  const idx = store.members.findIndex((m) => m._id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
  }
  store.members.splice(idx, 1);
  await saveStore(store);
  return NextResponse.json({ ok: true });
}
