import { requireSession } from "@/lib/api-auth";
import { connectMongo, isMongoEnabled } from "@/lib/mongodb";
import { ArtistModel, MemberModel, UserModel } from "@/lib/models";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic staff : Mongo Atlas joignable ?
 * Ne renvoie jamais l’URI complète.
 */
export async function GET() {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const uri = process.env.MONGODB_URI?.trim() || "";
  const dbName = process.env.MONGODB_DB?.trim() || "dashboard_biiip";
  const enabled = isMongoEnabled();

  if (!enabled) {
    return NextResponse.json({
      ok: false,
      mongo_enabled: false,
      error:
        "MONGODB_URI absente sur cet environnement. Sans Mongo, les données sont en mémoire et disparaissent sur Vercel.",
      hint: "Vercel → Settings → Environment Variables → MONGODB_URI (Production) + Redeploy.",
    });
  }

  // Masquer les secrets : mongodb+srv://user:***@host/...
  const uri_host =
    uri.replace(/^mongodb(\+srv)?:\/\/([^@]+@)?/, "mongodb$1://***@").split("?")[0] ||
    "(illisible)";

  try {
    await connectMongo();
    const ready = mongoose.connection.readyState; // 1 = connected
    const [users, artists, members] = await Promise.all([
      UserModel.countDocuments(),
      ArtistModel.countDocuments(),
      MemberModel.countDocuments(),
    ]);

    return NextResponse.json({
      ok: ready === 1,
      mongo_enabled: true,
      ready_state: ready,
      ready_label:
        ready === 1
          ? "connected"
          : ready === 2
            ? "connecting"
            : ready === 3
              ? "disconnecting"
              : "disconnected",
      db_name: dbName,
      uri_host,
      counts: { users, artists, members },
      hint:
        ready === 1
          ? "Mongo Atlas répond. Si un artiste disparaît, ce n’est pas l’absence de base — regarde une suppression ou une course critique saveStore."
          : "Connecté partiellement — réessaie.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Mongo";
    const lower = message.toLowerCase();
    let hint =
      "Vérifie Atlas : cluster allumé, Network Access 0.0.0.0/0, URI/mot de passe valides.";
    if (/whitelist|ip|not authorized|authentication failed/i.test(message)) {
      hint =
        "Atlas bloque l’accès : Network Access → Add IP → Allow Access from Anywhere (0.0.0.0/0), ou auth user/mdp incorrect.";
    } else if (/enotfound|querySrv|dns|timeout|econnrefused/i.test(lower)) {
      hint =
        "Réseau / DNS : cluster pausé, mauvais host, ou Atlas inaccessible depuis Vercel.";
    }

    return NextResponse.json(
      {
        ok: false,
        mongo_enabled: true,
        db_name: dbName,
        uri_host,
        error: message.slice(0, 280),
        hint,
      },
      { status: 503 }
    );
  }
}
