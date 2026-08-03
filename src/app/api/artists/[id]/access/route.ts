import { requireSession } from "@/lib/api-auth";
import { generateArtistAccessCode } from "@/lib/artist-access";
import { sendDocumentEmail, sendTransactionalSms } from "@/lib/brevo";
import { nowIso } from "@/lib/ids";
import { loadStore, saveStore } from "@/lib/store";
import { NextResponse } from "next/server";

function portalUrl(req: Request) {
  const origin = new URL(req.url).origin;
  return `${origin}/ma-fiche`;
}

function accessMessage(stageName: string, code: string, link: string) {
  return `Salut ${stageName} ! Fiche Biiip : ${link} — code ${code}`;
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

  const link = portalUrl(req);

  if (action === "generate" || action === "reset") {
    artist.access_code = generateArtistAccessCode();
    artist.access_code_updated_at = nowIso();
    artist.updated_at = artist.access_code_updated_at;
    await saveStore(store);
    return NextResponse.json({
      artist,
      access_code: artist.access_code,
      portal_url: link,
      message:
        action === "reset"
          ? "Nouveau code généré — tu peux le renvoyer."
          : "Code d'accès créé.",
    });
  }

  if (!artist.access_code) {
    artist.access_code = generateArtistAccessCode();
    artist.access_code_updated_at = nowIso();
  }

  const msg = accessMessage(artist.stage_name, artist.access_code, link);

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
        portal_url: link,
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
          <p>Voici ton accès pour compléter ta fiche :</p>
          <p style="font-size:22px;letter-spacing:2px"><strong>${artist.access_code}</strong></p>
          <p><a href="${link}">${link}</a></p>
          <p>À très bientôt sur scène.</p>
        </div>`;
      const result = await sendDocumentEmail(
        artist.email,
        "Ton accès fiche — Biiip Comedy Club",
        html
      );
      await saveStore(store);
      return NextResponse.json({
        ok: true,
        simulated: result.simulated,
        access_code: artist.access_code,
        portal_url: link,
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
