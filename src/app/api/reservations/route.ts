import { requireSession } from "@/lib/api-auth";
import { getSeatsReservedMap, isShowBookable, listReservations } from "@/lib/public-store";
import { loadStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Shows + réservations spectateurs (staff). `?format=csv&show_id=…` pour l'export. */
export async function GET(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const show_id = searchParams.get("show_id") || undefined;

  const store = await loadStore();
  const reservations = await listReservations(show_id);

  if (searchParams.get("format") === "csv") {
    const showsById = new Map(store.shows.map((s) => [s._id, s]));
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "show_title",
      "show_date",
      "full_name",
      "email",
      "member_number",
      "seats_count",
      "reservation_status",
      "ticket_code",
      "has_requested_membership",
      "created_at",
    ];
    const lines = reservations.map((r) => {
      const s = showsById.get(r.show_id);
      return [
        s?.title,
        s?.show_date,
        r.full_name,
        r.email,
        r.member_number || "",
        r.seats_count,
        r.reservation_status,
        r.ticket_code,
        r.has_requested_membership,
        r.created_at,
      ]
        .map(esc)
        .join(";");
    });
    return new NextResponse("﻿" + [header.join(";"), ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations-biiip.csv"`,
      },
    });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  const withResa = new Set(reservations.map((r) => r.show_id));
  const shows = store.shows
    .filter((s) => s.show_date >= today || withResa.has(s._id))
    .sort((a, b) => a.show_date.localeCompare(b.show_date))
    .map((s) => ({ ...s, is_bookable: isShowBookable(s) }));
  const seats_reserved = await getSeatsReservedMap(shows.map((s) => s._id));

  return NextResponse.json({ shows, reservations, seats_reserved });
}
