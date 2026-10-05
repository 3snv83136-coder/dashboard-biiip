/**
 * Écritures publiques (adhésion par QR code, réservation de places).
 *
 * ⚠️ Ces fonctions n'utilisent JAMAIS `saveStore()` : celui-ci efface puis
 * réécrit toute la base. Ici on fait uniquement des écritures unitaires et
 * atomiques, pour qu'un afflux d'inscriptions simultanées ne perde rien.
 */
import { randomBytes } from "crypto";
import mongoose, { Schema, type Model } from "mongoose";
import { createId, nowIso } from "./ids";
import { MEMBERSHIP_TERMS_VERSION } from "./membership-terms";
import { MemberModel, ShowModel } from "./models";
import { connectMongo, isMongoEnabled } from "./mongodb";
import { getStore } from "./store";
import type { Member, SeatReservation, Show } from "./types";

function looseModel<T>(name: string, collection: string): Model<T> {
  if (mongoose.models[name]) return mongoose.models[name] as Model<T>;
  const schema = new Schema<T>(
    { _id: { type: String, required: true } },
    { collection, strict: false, versionKey: false }
  );
  return mongoose.model<T>(name, schema);
}

export const SeatReservationModel = looseModel<SeatReservation>(
  "SeatReservation",
  "seat_reservations"
);
interface CounterDoc {
  _id: string;
  seq: number;
}
interface SeatCounterDoc {
  _id: string;
  seats_reserved: number;
}
const CounterModel = looseModel<CounterDoc>("Counter", "counters");
const SeatCounterModel = looseModel<SeatCounterDoc>(
  "ShowSeatCounter",
  "show_seat_counters"
);

/* ---------- mémoire (dev sans MONGODB_URI) ---------- */
declare global {
  // eslint-disable-next-line no-var
  var __biiipPublic:
    | { seq: number; reservations: SeatReservation[]; seats: Record<string, number> }
    | undefined;
}
function mem() {
  if (!global.__biiipPublic) {
    global.__biiipPublic = { seq: 0, reservations: [], seats: {} };
  }
  return global.__biiipPublic;
}

export function normalizeEmail(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 200;
}

function formatMemberNumber(seq: number): string {
  return `BIIIP-${String(seq).padStart(6, "0")}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ======================= ADHÉSION ======================= */

export async function findMemberByEmail(email: string): Promise<Member | null> {
  const e = normalizeEmail(email);
  if (!isMongoEnabled()) {
    return getStore().members.find((m) => normalizeEmail(m.email) === e) ?? null;
  }
  await connectMongo();
  const doc = await MemberModel.findOne({
    email: { $regex: `^${escapeRegex(e)}$`, $options: "i" },
  }).lean();
  return (doc as Member | null) ?? null;
}

export async function findMemberById(id: string): Promise<Member | null> {
  if (!isMongoEnabled()) {
    return getStore().members.find((m) => m._id === id) ?? null;
  }
  await connectMongo();
  return ((await MemberModel.findOne({ _id: id }).lean()) as Member | null) ?? null;
}

export async function nextMemberNumber(): Promise<string> {
  if (!isMongoEnabled()) {
    const st = mem();
    st.seq += 1;
    return formatMemberNumber(st.seq);
  }
  await connectMongo();
  const doc = await CounterModel.findOneAndUpdate(
    { _id: "member_number" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  ).lean();
  return formatMemberNumber((doc as CounterDoc).seq);
}

/** Ajoute un numéro aux adhérents créés avant cette fonctionnalité. */
async function ensureMemberNumber(member: Member): Promise<Member> {
  if (member.member_number) return member;
  const member_number = await nextMemberNumber();
  if (isMongoEnabled()) {
    await MemberModel.updateOne({ _id: member._id }, { $set: { member_number } });
  } else {
    const m = getStore().members.find((x) => x._id === member._id);
    if (m) m.member_number = member_number;
  }
  return { ...member, member_number };
}

/**
 * Adhésion gratuite par email. Idempotent : si l'email existe déjà,
 * on renvoie l'adhérent existant (pas de doublon).
 */
export async function joinAsMember(input: {
  email: string;
  full_name?: string;
  consent_communications: boolean;
  signup_source: string;
}): Promise<{ member: Member; is_new: boolean }> {
  const email = normalizeEmail(input.email);
  const existing = await findMemberByEmail(email);
  if (existing) {
    return { member: await ensureMemberNumber(existing), is_new: false };
  }

  const ts = nowIso();
  const member: Member = {
    _id: createId("member"),
    full_name: String(input.full_name || "").trim(),
    email,
    phone: "",
    address_line: "",
    postal_code: "",
    city: "",
    membership_fee_amount: 0,
    membership_status: "active",
    is_fee_paid: false,
    fee_paid_at: null,
    accepted_terms: true,
    accepted_terms_at: ts,
    terms_version: MEMBERSHIP_TERMS_VERSION,
    consent_communications: input.consent_communications,
    member_number: await nextMemberNumber(),
    signup_source: input.signup_source.slice(0, 40) || "site",
    joined_at: ts,
    internal_notes: "",
    created_by: "public",
    created_at: ts,
    updated_at: ts,
  };

  if (!isMongoEnabled()) {
    getStore().members.push(member);
    return { member, is_new: true };
  }
  await connectMongo();
  // Upsert conditionnel : si deux scans arrivent en même temps, un seul crée.
  const res = await MemberModel.findOneAndUpdate(
    { email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } },
    { $setOnInsert: member },
    { upsert: true, returnDocument: "after" }
  ).lean();
  const saved = res as unknown as Member;
  return { member: saved, is_new: saved._id === member._id };
}

/* ======================= SPECTACLES ======================= */

function todayParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(
    new Date()
  );
}

/** Shows ouverts à la réservation : confirmés/payés, à venir, non masqués. */
export function isShowBookable(show: Show): boolean {
  const flag = (show as Show & { is_public_booking?: boolean }).is_public_booking;
  return (
    show.booking_status !== "pressenti" &&
    flag !== false &&
    show.show_date >= todayParis()
  );
}

export async function listBookableShows(): Promise<Show[]> {
  let shows: Show[];
  if (!isMongoEnabled()) {
    shows = getStore().shows;
  } else {
    await connectMongo();
    shows = (await ShowModel.find({ show_date: { $gte: todayParis() } }).lean()) as Show[];
  }
  return shows
    .filter(isShowBookable)
    .sort((a, b) =>
      `${a.show_date} ${a.start_time}`.localeCompare(`${b.show_date} ${b.start_time}`)
    );
}

export async function getShow(id: string): Promise<Show | null> {
  if (!isMongoEnabled()) return getStore().shows.find((s) => s._id === id) ?? null;
  await connectMongo();
  return ((await ShowModel.findOne({ _id: id }).lean()) as Show | null) ?? null;
}

export async function getSeatsReserved(show_id: string): Promise<number> {
  if (!isMongoEnabled()) return mem().seats[show_id] ?? 0;
  await connectMongo();
  const doc = (await SeatCounterModel.findOne({ _id: show_id }).lean()) as SeatCounterDoc | null;
  return doc?.seats_reserved ?? 0;
}

export async function getSeatsReservedMap(ids: string[]): Promise<Record<string, number>> {
  if (!isMongoEnabled()) {
    return Object.fromEntries(ids.map((id) => [id, mem().seats[id] ?? 0]));
  }
  await connectMongo();
  const docs = (await SeatCounterModel.find({ _id: { $in: ids } }).lean()) as SeatCounterDoc[];
  const map: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const d of docs) map[d._id] = d.seats_reserved;
  return map;
}

/** Prend n places si disponibles — atomique, jamais de surbooking. */
async function takeSeats(show_id: string, n: number, capacity: number): Promise<boolean> {
  if (!isMongoEnabled()) {
    const st = mem();
    const cur = st.seats[show_id] ?? 0;
    if (cur + n > capacity) return false;
    st.seats[show_id] = cur + n;
    return true;
  }
  await connectMongo();
  await SeatCounterModel.updateOne(
    { _id: show_id },
    { $setOnInsert: { seats_reserved: 0 } },
    { upsert: true }
  );
  const res = await SeatCounterModel.findOneAndUpdate(
    { _id: show_id, seats_reserved: { $lte: capacity - n } },
    { $inc: { seats_reserved: n } },
    { returnDocument: "after" }
  ).lean();
  return Boolean(res);
}

async function releaseSeats(show_id: string, n: number): Promise<void> {
  if (!isMongoEnabled()) {
    const st = mem();
    st.seats[show_id] = Math.max(0, (st.seats[show_id] ?? 0) - n);
    return;
  }
  await connectMongo();
  await SeatCounterModel.updateOne(
    { _id: show_id, seats_reserved: { $gte: n } },
    { $inc: { seats_reserved: -n } }
  );
}

export async function findReservation(
  show_id: string,
  email: string
): Promise<SeatReservation | null> {
  const e = normalizeEmail(email);
  if (!isMongoEnabled()) {
    return (
      mem().reservations.find(
        (r) => r.show_id === show_id && r.email === e && r.reservation_status !== "annulee"
      ) ?? null
    );
  }
  await connectMongo();
  return ((await SeatReservationModel.findOne({
    show_id,
    email: e,
    reservation_status: { $ne: "annulee" },
  }).lean()) as SeatReservation | null) ?? null;
}

export async function getReservationById(id: string): Promise<SeatReservation | null> {
  if (!isMongoEnabled()) return mem().reservations.find((r) => r._id === id) ?? null;
  await connectMongo();
  return ((await SeatReservationModel.findOne({ _id: id }).lean()) as SeatReservation | null) ?? null;
}

export type ReserveResult =
  | { ok: true; reservation: SeatReservation; is_new: boolean }
  | { ok: false; reason: "not_found" | "closed" | "full" };

export async function reserveSeats(input: {
  show_id: string;
  full_name: string;
  email: string;
  seats_count: number;
  has_requested_membership: boolean;
  member_id: string | null;
}): Promise<ReserveResult> {
  const show = await getShow(input.show_id);
  if (!show) return { ok: false, reason: "not_found" };
  if (!isShowBookable(show)) return { ok: false, reason: "closed" };

  const email = normalizeEmail(input.email);
  const existing = await findReservation(show._id, email);
  if (existing) return { ok: true, reservation: existing, is_new: false };

  const capacity = Number(show.capacity) || 19;
  const got = await takeSeats(show._id, input.seats_count, capacity);
  if (!got) return { ok: false, reason: "full" };

  const ts = nowIso();
  const reservation: SeatReservation = {
    _id: createId("resa"),
    show_id: show._id,
    full_name: input.full_name.trim().slice(0, 120),
    email,
    seats_count: input.seats_count,
    reservation_status: "confirmee",
    ticket_code: randomBytes(6).toString("hex").toUpperCase(),
    accepted_terms_at: ts,
    has_requested_membership: input.has_requested_membership,
    member_id: input.member_id,
    created_at: ts,
    updated_at: ts,
  };

  try {
    if (!isMongoEnabled()) {
      mem().reservations.push(reservation);
    } else {
      await connectMongo();
      await SeatReservationModel.create(reservation);
    }
  } catch (err) {
    await releaseSeats(show._id, input.seats_count);
    throw err;
  }
  return { ok: true, reservation, is_new: true };
}

/* ---------- côté staff ---------- */

export async function listReservations(show_id?: string): Promise<SeatReservation[]> {
  let rows: SeatReservation[];
  if (!isMongoEnabled()) {
    rows = mem().reservations.filter((r) => !show_id || r.show_id === show_id);
  } else {
    await connectMongo();
    rows = (await SeatReservationModel.find(show_id ? { show_id } : {}).lean()) as SeatReservation[];
  }
  return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function setReservationStatus(
  id: string,
  status: SeatReservation["reservation_status"]
): Promise<SeatReservation | null> {
  const resa = await getReservationById(id);
  if (!resa) return null;
  if (resa.reservation_status === status) return resa;

  const ts = nowIso();
  const wasCancelled = resa.reservation_status === "annulee";
  const nowCancelled = status === "annulee";

  if (!wasCancelled && nowCancelled) {
    await releaseSeats(resa.show_id, resa.seats_count);
  } else if (wasCancelled && !nowCancelled) {
    const show = await getShow(resa.show_id);
    const ok = await takeSeats(resa.show_id, resa.seats_count, Number(show?.capacity) || 19);
    if (!ok) throw new Error("Plus assez de places pour réactiver cette réservation");
  }

  if (!isMongoEnabled()) {
    const r = mem().reservations.find((x) => x._id === id)!;
    r.reservation_status = status;
    r.updated_at = ts;
    return r;
  }
  await connectMongo();
  return ((await SeatReservationModel.findOneAndUpdate(
    { _id: id },
    { $set: { reservation_status: status, updated_at: ts } },
    { returnDocument: "after" }
  ).lean()) as SeatReservation | null) ?? null;
}

/** Nettoie résas + compteur de places d’un show (après suppression calendrier). */
export async function purgeShowPublicData(show_id: string): Promise<void> {
  if (!isMongoEnabled()) {
    const st = mem();
    st.reservations = st.reservations.filter((r) => r.show_id !== show_id);
    delete st.seats[show_id];
    return;
  }
  await connectMongo();
  await SeatReservationModel.deleteMany({ show_id });
  await SeatCounterModel.deleteOne({ _id: show_id });
}

/* ---------- anti-spam ---------- */

const hits = new Map<string, number[]>();
/** Limite simple par IP (par instance serveur). */
export function rateLimited(key: string, max = 6, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
