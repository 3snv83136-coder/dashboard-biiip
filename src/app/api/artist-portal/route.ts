import { generateArtistAccessCode } from "@/lib/artist-access";
import {
  clearArtistPortalCookie,
  getArtistPortalArtistId,
  setArtistPortalCookie,
} from "@/lib/artist-portal-session";
import {
  normalizePhoneE164,
  sendDocumentEmail,
  sendTransactionalSms,
} from "@/lib/brevo";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
  const artistId = await getArtistPortalArtistId();
  if (!artistId) {
    return NextResponse.json({ authenticated: false });
  }
  const store = await loadStore();
  const artist = store.artists.find((a) => a._id === artistId);
  if (!artist) {
    await clearArtistPortalCookie();
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    artist: {
      _id: artist._id,
      stage_name: artist.stage_name,
      legal_name: artist.legal_name,
      email: artist.email,
      phone: artist.phone,
      bio: artist.bio,
      photo_url: artist.photo_url,
      instagram_handle: artist.instagram_handle,
      tiktok_handle: artist.tiktok_handle,
      technical_needs: artist.technical_needs ?? "",
      dietary_notes: artist.dietary_notes ?? "",
      city: artist.city ?? "",
      access_profile_completed_at: artist.access_profile_completed_at,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = String(body.action || "login");
  const store = await loadStore();

  if (action === "logout") {
    await clearArtistPortalCookie();
    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    const code = String(body.access_code || "")
      .trim()
      .replace(/\s+/g, "");
    if (!code) {
      return NextResponse.json({ error: "Code obligatoire" }, { status: 400 });
    }
    const artist = store.artists.find(
      (a) => (a.access_code || "").trim() === code
    );
    if (!artist) {
      return NextResponse.json(
        { error: "Code incorrect. Vérifie avec le Biiip." },
        { status: 401 }
      );
    }
    artist.access_last_login_at = nowIso();
    await saveStore(store);
    await setArtistPortalCookie(artist._id);
    return NextResponse.json({
      ok: true,
      stage_name: artist.stage_name,
    });
  }

  if (action === "forgot") {
    const raw = String(body.email_or_phone || "").trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Indique ton email ou ton téléphone." },
        { status: 400 }
      );
    }
    const phoneNorm = normalizePhoneE164(raw);
    const artist = store.artists.find((a) => {
      const emailMatch =
        a.email && a.email.toLowerCase() === raw.toLowerCase();
      const phoneMatch =
        a.phone &&
        (a.phone === raw ||
          normalizePhoneE164(a.phone) === phoneNorm ||
          a.phone.replace(/\s/g, "") === raw.replace(/\s/g, ""));
      return Boolean(emailMatch || phoneMatch);
    });

    if (!artist) {
      // Message volontairement neutre
      return NextResponse.json({
        ok: true,
        message:
          "Si on te trouve dans le fichier, un nouveau code part vers toi.",
      });
    }

    artist.access_code = generateArtistAccessCode();
    artist.access_code_updated_at = nowIso();
    artist.updated_at = artist.access_code_updated_at;
    await saveStore(store);

    const origin = new URL(req.url).origin;
    const link = `${origin}/ma-fiche`;
    const channel =
      artist.email && artist.email.toLowerCase() === raw.toLowerCase()
        ? "email"
        : "sms";

    try {
      if (channel === "email" && artist.email) {
        await sendDocumentEmail(
          artist.email,
          "Nouveau code d'accès — Biiip Comedy Club",
          `<p>Salut ${artist.stage_name},</p>
           <p>Voici ton nouveau code : <strong>${artist.access_code}</strong></p>
           <p><a href="${link}">${link}</a></p>`
        );
      } else if (artist.phone) {
        await sendTransactionalSms(
          artist.phone,
          `Biiip Comedy Club — nouveau code : ${artist.access_code} — ${link}`
        );
      }
    } catch {
      // code déjà régénéré ; staff pourra renvoyer depuis le dashboard
    }

    return NextResponse.json({
      ok: true,
      message:
        "Nouveau code généré. Vérifie tes messages — ou demande au Biiip de te le renvoyer.",
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const artistId = await getArtistPortalArtistId();
  if (!artistId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const store = await loadStore();
  const artist = store.artists.find((a) => a._id === artistId);
  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const fields = [
    "stage_name",
    "legal_name",
    "email",
    "phone",
    "bio",
    "photo_url",
    "instagram_handle",
    "tiktok_handle",
    "technical_needs",
    "dietary_notes",
    "city",
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) {
      artist[field] = String(body[field] ?? "");
    }
  }

  if (!artist.stage_name.trim()) {
    return NextResponse.json(
      { error: "Le nom de scène est obligatoire" },
      { status: 400 }
    );
  }

  artist.updated_at = nowIso();
  if (!artist.access_profile_completed_at) {
    artist.access_profile_completed_at = artist.updated_at;
  }
  await saveStore(store);

  return NextResponse.json({
    ok: true,
    message: "Fiche enregistrée. Merci 🎤",
    artist,
  });
}
