import bcrypt from "bcryptjs";
import { ensureArtistAccessFields } from "./artist-access";
import { createId, nowIso } from "./ids";
import { connectMongo, isMongoEnabled } from "./mongodb";
import {
  ArtistModel,
  ContactModel,
  DocumentModel,
  MediaAssetModel,
  RadioEpisodeModel,
  RadioGuestModel,
  ReviewRequestModel,
  ShowBookingModel,
  ShowModel,
  SiteStoryModel,
  UserModel,
} from "./models";
import type {
  Artist,
  Contact,
  DocumentRecord,
  MediaAsset,
  RadioEpisode,
  RadioGuest,
  ReviewRequest,
  Show,
  ShowBooking,
  SiteStory,
  User,
} from "./types";

export interface DataStore {
  users: User[];
  artists: Artist[];
  shows: Show[];
  show_bookings: ShowBooking[];
  documents: DocumentRecord[];
  contacts: Contact[];
  review_requests: ReviewRequest[];
  media_assets: MediaAsset[];
  radio_episodes: RadioEpisode[];
  radio_guests: RadioGuest[];
  site_stories: SiteStory[];
}

declare global {
  // eslint-disable-next-line no-var
  var __biiipStore: DataStore | undefined;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function asDocs<T>(rows: unknown[]): T[] {
  return rows.map((row) => {
    const obj = { ...(row as Record<string, unknown>) };
    delete obj.__v;
    return obj as T;
  });
}

async function hydrateFromMongo(): Promise<DataStore> {
  await connectMongo();
  const [
    users,
    artists,
    shows,
    show_bookings,
    documents,
    contacts,
    review_requests,
    media_assets,
    radio_episodes,
    radio_guests,
    site_stories,
  ] = await Promise.all([
    UserModel.find().lean(),
    ArtistModel.find().lean(),
    ShowModel.find().lean(),
    ShowBookingModel.find().lean(),
    DocumentModel.find().lean(),
    ContactModel.find().lean(),
    ReviewRequestModel.find().lean(),
    MediaAssetModel.find().lean(),
    RadioEpisodeModel.find().lean(),
    RadioGuestModel.find().lean(),
    SiteStoryModel.find().lean(),
  ]);

  return {
    users: asDocs<User>(users),
    artists: asDocs<Artist>(artists),
    shows: asDocs<Show>(shows),
    show_bookings: asDocs<ShowBooking>(show_bookings),
    documents: asDocs<DocumentRecord>(documents),
    contacts: asDocs<Contact>(contacts),
    review_requests: asDocs<ReviewRequest>(review_requests),
    media_assets: asDocs<MediaAsset>(media_assets),
    radio_episodes: asDocs<RadioEpisode>(radio_episodes),
    radio_guests: asDocs<RadioGuest>(radio_guests),
    site_stories: asDocs<SiteStory>(site_stories),
  };
}

async function persistToMongo(store: DataStore): Promise<void> {
  await connectMongo();
  await Promise.all([
    UserModel.deleteMany({}),
    ArtistModel.deleteMany({}),
    ShowModel.deleteMany({}),
    ShowBookingModel.deleteMany({}),
    DocumentModel.deleteMany({}),
    ContactModel.deleteMany({}),
    ReviewRequestModel.deleteMany({}),
    MediaAssetModel.deleteMany({}),
    RadioEpisodeModel.deleteMany({}),
    RadioGuestModel.deleteMany({}),
    SiteStoryModel.deleteMany({}),
  ]);

  await Promise.all([
    store.users.length ? UserModel.insertMany(store.users, { ordered: false }) : null,
    store.artists.length
      ? ArtistModel.insertMany(store.artists, { ordered: false })
      : null,
    store.shows.length ? ShowModel.insertMany(store.shows, { ordered: false }) : null,
    store.show_bookings.length
      ? ShowBookingModel.insertMany(store.show_bookings, { ordered: false })
      : null,
    store.documents.length
      ? DocumentModel.insertMany(store.documents, { ordered: false })
      : null,
    store.contacts.length
      ? ContactModel.insertMany(store.contacts, { ordered: false })
      : null,
    store.review_requests.length
      ? ReviewRequestModel.insertMany(store.review_requests, { ordered: false })
      : null,
    store.media_assets.length
      ? MediaAssetModel.insertMany(store.media_assets, { ordered: false })
      : null,
    store.radio_episodes.length
      ? RadioEpisodeModel.insertMany(store.radio_episodes, { ordered: false })
      : null,
    store.radio_guests.length
      ? RadioGuestModel.insertMany(store.radio_guests, { ordered: false })
      : null,
    store.site_stories?.length
      ? SiteStoryModel.insertMany(store.site_stories, { ordered: false })
      : null,
  ]);
}

/** Store mémoire (dev sans Mongo) — synchrone. */
export function getStore(): DataStore {
  if (!global.__biiipStore) {
    global.__biiipStore = createSeedStore();
  }
  const store = global.__biiipStore;
  if (!store.radio_episodes) store.radio_episodes = [];
  if (!store.radio_guests) store.radio_guests = [];
  if (!store.site_stories) store.site_stories = [];
  return store;
}

/**
 * Charge le store (Mongo si `MONGODB_URI`, sinon mémoire).
 */
export async function loadStore(): Promise<DataStore> {
  if (!isMongoEnabled()) {
    const store = getStore();
    store.artists = store.artists.map(ensureArtistAccessFields);
    return store;
  }

  let store = await hydrateFromMongo();
  if (store.users.length === 0) {
    store = createSeedStore();
    await persistToMongo(store);
  }
  store.artists = store.artists.map(ensureArtistAccessFields);
  if (!store.site_stories) store.site_stories = [];
  global.__biiipStore = store;
  return store;
}

/** Persiste le store vers Mongo (no-op sans URI). */
export async function saveStore(store?: DataStore): Promise<void> {
  if (!isMongoEnabled()) return;
  await persistToMongo(store ?? getStore());
}

/** Upsert d'une seule story — évite de réécrire toute la base (lent / fragile). */
export async function upsertSiteStory(story: SiteStory): Promise<void> {
  const store = await loadStore();
  if (!store.site_stories) store.site_stories = [];
  const idx = store.site_stories.findIndex((s) => s._id === story._id);
  if (idx >= 0) store.site_stories[idx] = story;
  else store.site_stories.push(story);
  global.__biiipStore = store;

  if (!isMongoEnabled()) return;
  await connectMongo();
  await SiteStoryModel.findOneAndUpdate(
    { _id: story._id },
    { $set: story },
    { upsert: true }
  );
}

/**
 * Charge le store, exécute le handler, puis persiste si Mongo.
 */
export async function withStore<T>(
  fn: (store: DataStore) => Promise<T> | T
): Promise<T> {
  const store = await loadStore();
  const result = await fn(store);
  await saveStore(store);
  return result;
}

export async function resetStore(): Promise<DataStore> {
  const store = createSeedStore();
  if (!isMongoEnabled()) {
    global.__biiipStore = store;
    return store;
  }
  await persistToMongo(store);
  global.__biiipStore = store;
  return store;
}

export function createSeedStore(): DataStore {
  const ts = nowIso();
  const password_hash = bcrypt.hashSync("biiip2026", 10);

  const artist1: Artist = {
    _id: createId("artist"),
    stage_name: "Léo Mirage",
    legal_name: "Léonard Moreau",
    email: "leo@example.com",
    phone: "+33601020304",
    bio: "Stand-up absurde, 8 ans de scène. Incubé au Biiip.",
    photo_url: "",
    artist_level: "confirme",
    default_fee_amount: 250,
    instagram_handle: "@leo.mirage",
    tiktok_handle: "",
    internal_notes: "Toujours à l'heure. Bon avec le public local.",
    access_code: "",
    access_code_updated_at: null,
    access_last_login_at: null,
    access_profile_completed_at: null,
    technical_needs: "",
    dietary_notes: "",
    city: "Toulon",
    created_at: ts,
    updated_at: ts,
  };

  const artist2: Artist = {
    _id: createId("artist"),
    stage_name: "Sara Volt",
    legal_name: "Sarah Benali",
    email: "sara@example.com",
    phone: "+33605060708",
    bio: "Jeune talent, humour social et observations.",
    photo_url: "",
    artist_level: "jeune_talent",
    default_fee_amount: 150,
    instagram_handle: "@sara.volt",
    tiktok_handle: "@saravolt",
    internal_notes: "À suivre de près — grosse progression.",
    access_code: "",
    access_code_updated_at: null,
    access_last_login_at: null,
    access_profile_completed_at: null,
    technical_needs: "",
    dietary_notes: "",
    city: "",
    created_at: ts,
    updated_at: ts,
  };

  const artist3: Artist = {
    _id: createId("artist"),
    stage_name: "Max Riff",
    legal_name: "Maxime Roux",
    email: "max@example.com",
    phone: "+33609001112",
    bio: "Tête d'affiche régionale, one-man show en tournée.",
    photo_url: "",
    artist_level: "tete_affiche",
    default_fee_amount: 600,
    instagram_handle: "@maxriff",
    tiktok_handle: "",
    internal_notes: "Cachet négociable hors saison.",
    access_code: "",
    access_code_updated_at: null,
    access_last_login_at: null,
    access_profile_completed_at: null,
    technical_needs: "",
    dietary_notes: "",
    city: "",
    created_at: ts,
    updated_at: ts,
  };

  const admin: User = {
    _id: createId("user"),
    full_name: "Gérant Biiip",
    email: "admin@biiip.local",
    phone: "+33600000001",
    role: "admin",
    artist_id: null,
    password_hash,
    is_active: true,
    last_login_at: null,
    created_at: ts,
    updated_at: ts,
  };

  const staff: User = {
    _id: createId("user"),
    full_name: "Équipe Cave",
    email: "staff@biiip.local",
    phone: "+33600000002",
    role: "staff",
    artist_id: null,
    password_hash,
    is_active: true,
    last_login_at: null,
    created_at: ts,
    updated_at: ts,
  };

  const artistUser: User = {
    _id: createId("user"),
    full_name: "Léo Mirage",
    email: "leo@biiip.local",
    phone: "+33601020304",
    role: "artist",
    artist_id: artist1._id,
    password_hash,
    is_active: true,
    last_login_at: null,
    created_at: ts,
    updated_at: ts,
  };

  const today = new Date();
  const shows: Show[] = [
    {
      _id: createId("show"),
      title: "Plateau Biiip",
      show_date: toDateString(addMonths(today, 0)),
      start_time: "20:30",
      show_type: "plateau",
      booking_status: "confirme",
      capacity: 19,
      billetweb_url: "https://www.billetweb.fr/",
      internal_notes: "Soirée de la semaine.",
      created_by: admin._id,
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("show"),
      title: "Open Mic Jeunes Talents",
      show_date: toDateString(addMonths(today, 1)),
      start_time: "20:00",
      show_type: "open_mic",
      booking_status: "pressenti",
      capacity: 19,
      billetweb_url: "",
      internal_notes: "À confirmer avec Sara.",
      created_by: admin._id,
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("show"),
      title: "Max Riff — One-man show",
      show_date: toDateString(addMonths(today, 2)),
      start_time: "20:30",
      show_type: "one_man_show",
      booking_status: "paye",
      capacity: 19,
      billetweb_url: "https://www.billetweb.fr/",
      internal_notes: "Acompte versé.",
      created_by: admin._id,
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("show"),
      title: "Scène ouverte",
      show_date: toDateString(addMonths(today, 3)),
      start_time: "19:30",
      show_type: "scene_ouverte",
      booking_status: "pressenti",
      capacity: 19,
      billetweb_url: "",
      internal_notes: "",
      created_by: admin._id,
      created_at: ts,
      updated_at: ts,
    },
  ];

  const bookings: ShowBooking[] = [
    {
      _id: createId("booking"),
      show_id: shows[0]._id,
      artist_id: artist1._id,
      slot_order: 1,
      set_duration_min: 15,
      fee_amount: 250,
      booking_status: "confirme",
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("booking"),
      show_id: shows[0]._id,
      artist_id: artist2._id,
      slot_order: 2,
      set_duration_min: 10,
      fee_amount: 150,
      booking_status: "confirme",
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("booking"),
      show_id: shows[1]._id,
      artist_id: artist2._id,
      slot_order: 1,
      set_duration_min: 8,
      fee_amount: 100,
      booking_status: "pressenti",
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("booking"),
      show_id: shows[2]._id,
      artist_id: artist3._id,
      slot_order: 1,
      set_duration_min: 60,
      fee_amount: 600,
      booking_status: "paye",
      created_at: ts,
      updated_at: ts,
    },
  ];

  const documents: DocumentRecord[] = [
    {
      _id: createId("doc"),
      show_id: shows[0]._id,
      artist_id: artist1._id,
      doc_type: "conducteur",
      file_url: "",
      generated_by: "claude",
      doc_status: "sent",
      content:
        "# Conducteur — Plateau Biiip\n\n20:30 — Accueil\n20:45 — Léo Mirage (15 min)\n21:05 — Sara Volt (10 min)\n21:20 — Fin / bar",
      sent_at: ts,
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("doc"),
      show_id: shows[0]._id,
      artist_id: artist1._id,
      doc_type: "fiche_technique",
      file_url: "",
      generated_by: "manual",
      doc_status: "draft",
      content: "Micro SM58 · Retour simple · Pas de vidéo",
      sent_at: null,
      created_at: ts,
      updated_at: ts,
    },
  ];

  const contacts: Contact[] = [
    {
      _id: createId("contact"),
      full_name: "Camille Dupont",
      email: "camille@example.com",
      phone: "+33611223344",
      source: "soiree",
      consent_marketing: true,
      tags: ["fidèle", "newsletter"],
      first_seen_at: ts,
      last_seen_at: ts,
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("contact"),
      full_name: "Julien Costa",
      email: "julien@example.com",
      phone: "+33655667788",
      source: "billetweb",
      consent_marketing: false,
      tags: ["nouveau"],
      first_seen_at: ts,
      last_seen_at: ts,
      created_at: ts,
      updated_at: ts,
    },
  ];

  const review_requests: ReviewRequest[] = [];

  const radioEpisode1: RadioEpisode = {
    _id: createId("radio"),
    title: "Radioactive — Live Cave",
    episode_date: toDateString(addMonths(today, 0)),
    start_time: "19:00",
    end_time: "20:00",
    episode_status: "confirme",
    theme: "Humour & coulisses du stand-up",
    synopsis: "Une heure avec les artistes du plateau de la semaine.",
    host_name: "Gérant Biiip",
    conductor_content:
      "# Conducteur — Radioactive\n\n19:00 — Générique / jingle\n19:05 — Accueil & pitch\n19:15 — Invité 1 (set + interview)\n19:40 — Invité 2\n19:55 — Outro & annonces soirées",
    playlist_notes: "Jingle Radioactive · bed soft pendant interviews",
    technical_notes: "2 micros SM58 · stream OBS · monitoring casque",
    stream_url: "",
    internal_notes: "Première de la saison.",
    created_by: admin._id,
    created_at: ts,
    updated_at: ts,
  };

  const radio_guests: RadioGuest[] = [
    {
      _id: createId("rguest"),
      radio_episode_id: radioEpisode1._id,
      artist_id: artist1._id,
      guest_name: artist1.stage_name,
      guest_role: "invite",
      slot_order: 1,
      segment_title: "Interview + extrait set",
      segment_duration_min: 20,
      talking_points: "Parcours · prochaines dates · anecdote cave",
      created_at: ts,
      updated_at: ts,
    },
    {
      _id: createId("rguest"),
      radio_episode_id: radioEpisode1._id,
      artist_id: artist2._id,
      guest_name: artist2.stage_name,
      guest_role: "chroniqueur",
      slot_order: 2,
      segment_title: "Chronique jeunes talents",
      segment_duration_min: 12,
      talking_points: "Scène ouverte · conseils débutants",
      created_at: ts,
      updated_at: ts,
    },
  ];

  const media_assets: MediaAsset[] = [
    {
      _id: createId("media"),
      show_id: shows[0]._id,
      media_type: "photo",
      file_url: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800",
      thumbnail_url: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400",
      alt_text: "Public du Biiip Comedy Club pendant un plateau",
      caption: "Ambiance cave — Plateau Biiip",
      seo_json_ld: {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        name: "Plateau Biiip",
        contentUrl: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800",
      },
      site_slug: "/galerie",
      is_published: false,
      published_at: null,
      created_at: ts,
      updated_at: ts,
    },
  ];

  return {
    users: [admin, staff, artistUser],
    artists: [artist1, artist2, artist3],
    shows,
    show_bookings: bookings,
    documents,
    contacts,
    review_requests,
    media_assets,
    radio_episodes: [radioEpisode1],
    radio_guests,
    site_stories: [],
  };
}
