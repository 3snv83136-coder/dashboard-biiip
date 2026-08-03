import { createId, nowIso } from "@/lib/ids";
import { connectMongo, isMongoEnabled } from "@/lib/mongodb";
import mongoose, { Schema, type Model } from "mongoose";

export type UploadDoc = {
  _id: string;
  mime_type: string;
  /** Base64 (sans préfixe data:) */
  data: string;
  file_name: string;
  created_at: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __biiipUploads: Map<string, UploadDoc> | undefined;
}

function UploadModel(): Model<UploadDoc> {
  if (mongoose.models.Upload) {
    return mongoose.models.Upload as Model<UploadDoc>;
  }
  const schema = new Schema<UploadDoc>(
    {
      _id: { type: String, required: true },
      mime_type: String,
      data: String,
      file_name: String,
      created_at: String,
    },
    { collection: "uploads", strict: false, versionKey: false }
  );
  return mongoose.model<UploadDoc>("Upload", schema);
}

function memoryUploads(): Map<string, UploadDoc> {
  if (!global.__biiipUploads) global.__biiipUploads = new Map();
  return global.__biiipUploads;
}

/** Persiste un fichier hors du store principal (pas effacé par saveStore). */
export async function saveUploadFile(params: {
  bytes: Buffer;
  mime_type: string;
  file_name: string;
}): Promise<{ id: string; public_path: string }> {
  const id = createId("upload");
  const doc: UploadDoc = {
    _id: id,
    mime_type: params.mime_type || "application/octet-stream",
    data: params.bytes.toString("base64"),
    file_name: params.file_name || "fichier",
    created_at: nowIso(),
  };

  if (isMongoEnabled()) {
    await connectMongo();
    await UploadModel().create(doc);
  } else {
    memoryUploads().set(id, doc);
  }

  return { id, public_path: `/api/uploads/${id}` };
}

export async function getUploadFile(
  id: string
): Promise<UploadDoc | null> {
  if (isMongoEnabled()) {
    await connectMongo();
    const doc = await UploadModel().findById(id).lean();
    return (doc as UploadDoc | null) ?? null;
  }
  return memoryUploads().get(id) ?? null;
}
