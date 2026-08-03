import mongoose, { Schema, type Model } from "mongoose";
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

/** Schémas souples : on stocke les docs tels que le store mémoire les produit. */
function modelOf<T>(name: string, collection: string): Model<T> {
  if (mongoose.models[name]) {
    return mongoose.models[name] as Model<T>;
  }
  const schema = new Schema<T>(
    { _id: { type: String, required: true } },
    { collection, strict: false, versionKey: false }
  );
  return mongoose.model<T>(name, schema);
}

export const UserModel = modelOf<User>("User", "users");
export const ArtistModel = modelOf<Artist>("Artist", "artists");
export const ShowModel = modelOf<Show>("Show", "shows");
export const ShowBookingModel = modelOf<ShowBooking>("ShowBooking", "show_bookings");
export const DocumentModel = modelOf<DocumentRecord>("Document", "documents");
export const ContactModel = modelOf<Contact>("Contact", "contacts");
export const ReviewRequestModel = modelOf<ReviewRequest>(
  "ReviewRequest",
  "review_requests"
);
export const MediaAssetModel = modelOf<MediaAsset>("MediaAsset", "media_assets");
export const RadioEpisodeModel = modelOf<RadioEpisode>(
  "RadioEpisode",
  "radio_episodes"
);
export const RadioGuestModel = modelOf<RadioGuest>("RadioGuest", "radio_guests");
export const SiteStoryModel = modelOf<SiteStory>("SiteStory", "site_stories");
