import type {
  ArtistLevel,
  BookingStatus,
  ContactSource,
  DocType,
  ShowType,
} from "./types";

export const GOOGLE_REVIEW_URL =
  "https://maps.google.com/?q=Biiip+Comedy+Club+Toulon&action=write-review";

export const DEFAULT_CAPACITY = 19;

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pressenti: "Pressenti",
  confirme: "Confirmé",
  paye: "Payé",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pressenti: "#ffb703",
  confirme: "#e94560",
  paye: "#3ddc97",
};

export const SHOW_TYPE_LABELS: Record<ShowType, string> = {
  plateau: "Plateau",
  one_man_show: "One-man show",
  scene_ouverte: "Scène ouverte",
  open_mic: "Open mic",
};

export const ARTIST_LEVEL_LABELS: Record<ArtistLevel, string> = {
  jeune_talent: "Jeune talent",
  confirme: "Confirmé",
  tete_affiche: "Tête d'affiche",
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  conducteur: "Conducteur",
  portrait: "Portrait",
  contrat_guso: "Contrat GUSO",
  fiche_technique: "Fiche technique",
};

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  soiree: "Soirée",
  billetweb: "Billetweb",
  manuel: "Manuel",
  avis: "Avis",
  import: "Import",
};

export const STAFF_NAV = [
  { href: "/calendrier", label: "Calendrier", icon: "calendar" },
  { href: "/artistes", label: "Artistes", icon: "users" },
  { href: "/documents", label: "Documents", icon: "file" },
  { href: "/contacts", label: "Contacts", icon: "contact" },
  { href: "/avis", label: "Avis Google", icon: "star" },
  { href: "/medias", label: "Médias", icon: "image" },
  { href: "/reglages", label: "Réglages", icon: "settings" },
] as const;

export const ARTIST_NAV = [
  { href: "/mon-espace", label: "Mon espace", icon: "home" },
] as const;
