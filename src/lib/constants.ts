import type {
  ArtistLevel,
  BookingStatus,
  ContactSource,
  DocType,
  RadioEpisodeStatus,
  RadioGuestRole,
  ShowType,
} from "./types";

export const GOOGLE_REVIEW_URL =
  "https://g.page/r/CQVV3gGN7QSuEAE/review";

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

export const RADIO_EPISODE_STATUS_LABELS: Record<RadioEpisodeStatus, string> = {
  draft: "Brouillon",
  confirme: "Confirmée",
  diffuse: "Diffusée",
  archive: "Archivée",
};

export const RADIO_EPISODE_STATUS_COLORS: Record<RadioEpisodeStatus, string> = {
  draft: "#9aa0b4",
  confirme: "#00d9ff",
  diffuse: "#3ddc97",
  archive: "#64748b",
};

export const RADIO_GUEST_ROLE_LABELS: Record<RadioGuestRole, string> = {
  invite: "Invité",
  co_host: "Co-animateur",
  chroniqueur: "Chroniqueur",
};

export const STAFF_NAV = [
  { href: "/accueil", label: "Accueil", icon: "home", color: "#e94560" },
  { href: "/calendrier", label: "Calendrier", icon: "calendar", color: "#00d9ff" },
  { href: "/radio", label: "Émission radio", icon: "radio", color: "#f43f5e" },
  { href: "/artistes", label: "Artistes", icon: "users", color: "#ffb703" },
  { href: "/documents", label: "Documents", icon: "file", color: "#3ddc97" },
  { href: "/contacts", label: "Contacts", icon: "contact", color: "#a855f7" },
  { href: "/avis", label: "Avis Google", icon: "star", color: "#ff6b35" },
  { href: "/medias", label: "Médias", icon: "image", color: "#38bdf8" },
  { href: "/reglages", label: "Réglages", icon: "settings", color: "#9aa0b4" },
] as const;

export const ARTIST_NAV = [
  { href: "/mon-espace", label: "Mon espace", icon: "home", color: "#e94560" },
] as const;
