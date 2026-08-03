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

/** Texte SMS par défaut pour les demandes d'avis Google. */
export const DEFAULT_REVIEW_SMS_BODY = `Un immense merci d'être passé au Biiip Comedy Club. On espère que tu as passé une bonne soirée.

Tu as aimé l'expérience ? Donne-nous un coup de pouce en laissant ton avis juste ici : ${GOOGLE_REVIEW_URL}

Ton soutien nous aide énormément à faire rayonner le club et à continuer de vous proposer les meilleurs spectacles. À très bientôt pour une nouvelle dose de rire !`;

/** Pages éditoriales site public */
export const BIIIP_REVIEW_TITLE_EN = "The Biiip Review";
export const BIIIP_REVIEW_TITLE_FR = "L'avis du Biiip";
export const PUBLIC_SITE_BASE = "https://biiipcomedyclub.fr";

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
  {
    href: "/accueil",
    label: "Accueil",
    icon: "home",
    color: "#e94560",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  },
  {
    href: "/calendrier",
    label: "Calendrier",
    icon: "calendar",
    color: "#00d9ff",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  },
  {
    href: "/radio",
    label: "Émission radio",
    icon: "radio",
    color: "#f43f5e",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
  },
  {
    href: "/artistes",
    label: "Artistes",
    icon: "users",
    color: "#ffb703",
    image:
      "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80",
  },
  {
    href: "/fiches-artistes",
    label: "Fiches artistes",
    icon: "key",
    color: "#f5d76e",
    image: "/biiip-fond.jpg",
  },
  {
    href: "/documents",
    label: "Documents",
    icon: "file",
    color: "#3ddc97",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: "contact",
    color: "#a855f7",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  },
  {
    href: "/avis",
    label: "Avis Google",
    icon: "star",
    color: "#ff6b35",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  },
  {
    href: "/medias",
    label: "Médias",
    icon: "image",
    color: "#38bdf8",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
  },
  {
    href: "/reglages",
    label: "Réglages",
    icon: "settings",
    color: "#9aa0b4",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
  },
] as const;

export const ARTIST_NAV = [
  {
    href: "/mon-espace",
    label: "Mon espace",
    icon: "home",
    color: "#e94560",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  },
] as const;
