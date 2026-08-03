import mongoose from "mongoose";
import { connectMongo, isMongoEnabled } from "../src/lib/mongodb";
import { loadStore } from "../src/lib/store";

async function main() {
  console.log("enabled", isMongoEnabled());
  try {
    await connectMongo();
    console.log("connected OK");
    const store = await loadStore();
    console.log(
      "users",
      store.users.length,
      "artists",
      store.artists.length,
      "contacts",
      store.contacts.length
    );
  } catch (e) {
    console.error("FAIL", e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void main();
