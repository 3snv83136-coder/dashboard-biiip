import mongoose from "mongoose";

const globalForMongo = globalThis as unknown as {
  __biiipMongoPromise?: Promise<typeof mongoose>;
};

export function isMongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI manquante");
  }

  if (globalForMongo.__biiipMongoPromise) {
    return globalForMongo.__biiipMongoPromise;
  }

  const dbName = process.env.MONGODB_DB?.trim() || "dashboard_biiip";

  globalForMongo.__biiipMongoPromise = mongoose.connect(uri, {
    dbName,
    bufferCommands: false,
  });

  try {
    return await globalForMongo.__biiipMongoPromise;
  } catch (err) {
    globalForMongo.__biiipMongoPromise = undefined;
    throw err;
  }
}
