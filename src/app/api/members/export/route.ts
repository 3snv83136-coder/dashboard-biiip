import { requireSession } from "@/lib/api-auth";
import { loadStore } from "@/lib/store";
import { NextResponse } from "next/server";

function csvEscape(value: string | number | boolean | null): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const members = store.members ?? [];
  const header = [
    "full_name",
    "email",
    "phone",
    "address_line",
    "postal_code",
    "city",
    "membership_fee_amount",
    "membership_status",
    "is_fee_paid",
    "fee_paid_at",
    "accepted_terms",
    "terms_version",
    "consent_communications",
    "joined_at",
  ];
  const lines = [
    header.join(","),
    ...members.map((m) =>
      [
        m.full_name,
        m.email,
        m.phone,
        m.address_line,
        m.postal_code,
        m.city,
        m.membership_fee_amount,
        m.membership_status,
        m.is_fee_paid,
        m.fee_paid_at,
        m.accepted_terms,
        m.terms_version,
        m.consent_communications,
        m.joined_at,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="adherents_biiip.csv"',
    },
  });
}
