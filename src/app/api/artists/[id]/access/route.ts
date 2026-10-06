import { requireSession } from "@/lib/api-auth";
import {
  artistPortalDeepLink,
  generateArtistAccessCode,
} from "@/lib/artist-access";
import { sendDocumentEmail, sendTransactionalSms } from "@/lib/brevo";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import { NextResponse } from "next/server";

function portalBase(req: Request) {
  return new URL(req.url).origin;
}

function accessMessage(stageName: string, code: string, deepLink: string) {
  return `Salut ${stageName} ! Complète ta fiche Biiip en flashant ce lien : ${deepLink} (code ${code})`;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "generate");
  const store = await loadStore();
  const artist = store.artists.find((a) => a._id === params.id);
  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  const origin = portalBase(req);

  if (action === "generate" || action === "reset") {
    artist.access_code = generateArtistAccessCode();
    artist.access_code_updated_at = nowIso();
    artist.updated_at = artist.access_code_updated_at;
    await saveStore(store);
    const deep = artistPortalDeepLink(origin, artist.access_code);
    return NextResponse.json({
      artist,
      access_code: artist.access_code,
      portal_url: deep,
      message:
        action === "reset"
          ? "Nouveau code + QR générés — tu peux les montrer ou les renvoyer."
          : "Code + QR d'accès créés. L’artiste peut flasher sur place.",
    });
  }

  if (!artist.access_code) {
    artist.access_code = generateArtistAccessCode();
    artist.access_code_updated_at = nowIso();
  }

  const deep = artistPortalDeepLink(origin, artist.access_code);
  const msg = accessMessage(artist.stage_name, artist.access_code, deep);

  if (action === "send_sms") {
    if (!artist.phone) {
      return NextResponse.json(
        { error: "Ajoute un téléphone sur la fiche avant d'envoyer un SMS." },
        { status: 400 }
      );
    }
    try {
      const result = await sendTransactionalSms(artist.phone, msg);
      await saveStore(store);
      return NextResponse.json({
        ok: true,
        simulated: result.simulated,
        access_code: artist.access_code,
        portal_url: deep,
        message: result.simulated
          ? "SMS simulé (pas de clé Brevo)."
          : "SMS envoyé ✅",
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Échec SMS" },
        { status: 502 }
      );
    }
  }

  if (action === "send_email") {
    if (!artist.email) {
      return NextResponse.json(
        { error: "Ajoute un email sur la fiche avant d'envoyer un mail." },
        { status: 400 }
      );
    }
    try {
      const html = `
        <div style="font-family:sans-serif;line-height:1.5;color:#111">
          <h2>Biiip Comedy Club — ta fiche artiste</h2>
          <p>Salut <strong>${artist.stage_name}</strong>,</p>
          <p>Complète ta fiche en un clic (ou flash le QR qu’on t’a montré) :</p>
          <p><a href="${deep}" style="display:inline-block;background:#19b2ea;color:#04131f;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px">Ouvrir ma fiche</a></p>
          <p>Code de secours : <strong style="letter-spacing:2px">${artist.access_code}</strong></p>
          <p>À très bientôt sur scène.</p>
        </div>`;
      const result = await sendDocumentEmail(
        artist.email,
        "Ton accès fiche — Biiip Comedy Club",
        html
      );
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || "Échec email Brevo" },
          { status: 502 }
        );
      }
      await saveStore(store);
      return NextResponse.json({
        ok: true,
        simulated: result.simulated,
        access_code: artist.access_code,
        portal_url: deep,
        message: result.simulated
          ? "Email simulé (pas de clé Brevo)."
          : "Email envoyé ✅",
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Échec email" },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
