import { requireSession } from "@/lib/api-auth";
import { setReservationStatus } from "@/lib/public-store";
import type { SeatReservationStatus } from "@/lib/types";
import { NextResponse } from "next/server";

const STATUSES: SeatReservationStatus[] = ["confirmee", "presente", "annulee"];

/** Pointage à l'entrée / annulation (libère les places). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json();
  const status = body.reservation_status as SeatReservationStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }
  try {
    const reservation = await setReservationStatus(params.id, status);
    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    return NextResponse.json({ reservation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 409 }
    );
  }
}
