import { requireSession } from "@/lib/api-auth";
import { loadStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const store = await loadStore();
  const contacts = store.contacts;
  const header = [
    "full_name",
    "email",
    "phone",
    "source",
    "consent_marketing",
    "tags",
    "first_seen_at",
    "last_seen_at",
  ];
  const lines = [
    header.join(","),
    ...contacts.map((c) =>
      [
        c.full_name,
        c.email,
        c.phone,
        c.source,
        c.consent_marketing,
        `"${c.tags.join(";")}"`,
        c.first_seen_at,
        c.last_seen_at,
      ].join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts_biiip.csv"',
    },
  });
}
