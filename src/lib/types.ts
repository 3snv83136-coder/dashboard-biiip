export type Role = "admin" | "staff" | "artist";
export type ArtistLevel = "jeune_talent" | "confirme" | "tete_affiche";
export type ShowType = "plateau" | "one_man_show" | "scene_ouverte" | "open_mic";
export type BookingStatus = "pressenti" | "confirme" | "paye";
export type DocType = "conducteur" | "portrait" | "contrat_guso" | "fiche_technique";
export type DocStatus = "draft" | "sent" | "signed";
export type ContactSource = "soiree" | "billetweb" | "manuel" | "avis" | "import";
export type SendStatus = "pending" | "sent" | "failed";
export type MediaType = "photo" | "video";
export type RadioEpisodeStatus = "draft" | "confirme" | "diffuse" | "archive";
export type RadioGuestRole = "invite" | "co_host" | "chroniqueur";

export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  artist_id: string | null;
  password_hash: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Artist {
  _id: string;
  stage_name: string;
  legal_name: string;
  email: string;
  phone: string;
  bio: string;
  photo_url: string;
  artist_level: ArtistLevel;
  default_fee_amount: number;
  instagram_handle: string;
  tiktok_handle: string;
  internal_notes: string;
  /** Code d'accès portail fiche (partagé à la main / SMS / email). */
  access_code: string;
  access_code_updated_at: string | null;
  access_last_login_at: string | null;
  access_profile_completed_at: string | null;
  technical_needs: string;
  dietary_notes: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface Show {
  _id: string;
  title: string;
  show_date: string;
  start_time: string;
  show_type: ShowType;
  booking_status: BookingStatus;
  capacity: number;
  billetweb_url: string;
  internal_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShowBooking {
  _id: string;
  show_id: string;
  artist_id: string;
  slot_order: number;
  set_duration_min: number;
  fee_amount: number;
  booking_status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  _id: string;
  show_id: string;
  artist_id: string;
  doc_type: DocType;
  file_url: string;
  generated_by: "claude" | "manual";
  doc_status: DocStatus;
  content: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  source: ContactSource;
  consent_marketing: boolean;
  tags: string[];
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewRequest {
  _id: string;
  contact_id: string | null;
  phone: string;
  message_body: string;
  send_status: SendStatus;
  provider: string;
  provider_message_id: string;
  sent_at: string | null;
  created_by: string;
  created_at: string;
}

export interface MediaAsset {
  _id: string;
  show_id: string | null;
  media_type: MediaType;
  file_url: string;
  thumbnail_url: string;
  alt_text: string;
  caption: string;
  seo_json_ld: Record<string, unknown>;
  site_slug: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Page « The Biiip Review » pour le site public (EN). */
export interface SiteStory {
  _id: string;
  title_en: string;
  title_fr: string;
  slug: string;
  body_text: string;
  photo_urls: string[];
  video_url: string;
  show_id: string | null;
  is_published: boolean;
  published_at: string | null;
  public_path: string;
  site_target_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Émission radio (Radioactive / web radio Biiip). */
export interface RadioEpisode {
  _id: string;
  title: string;
  episode_date: string;
  start_time: string;
  end_time: string;
  episode_status: RadioEpisodeStatus;
  theme: string;
  synopsis: string;
  host_name: string;
  conductor_content: string;
  playlist_notes: string;
  technical_notes: string;
  stream_url: string;
  internal_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Invité / intervenant d'une émission radio. */
export interface RadioGuest {
  _id: string;
  radio_episode_id: string;
  artist_id: string | null;
  guest_name: string;
  guest_role: RadioGuestRole;
  slot_order: number;
  segment_title: string;
  segment_duration_min: number;
  talking_points: string;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  artist_id: string | null;
}
