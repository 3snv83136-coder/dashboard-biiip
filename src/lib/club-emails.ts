import { sendDocumentEmail, type EmailSendResult } from "./brevo";
import { escapeHtml, formatJoinDate, formatLongDate, formatTime } from "./club-format";
import { VENUE_FULL_ADDRESS } from "./constants";
import type { Member, SeatReservation, Show } from "./types";

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#05080e;font-family:Arial,Helvetica,sans-serif;color:#eaf6ff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05080e"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#0b111c;border-radius:18px;border:1px solid #24354d">
<tr><td style="padding:28px 26px">
<div style="font-size:40px;font-weight:900;color:#19b2ea;line-height:1">BIIIP</div>
<div style="font-size:13px;font-weight:700;letter-spacing:5px;color:#8fe3ff;margin-top:4px">COMEDY CLUB</div>
${inner}
<p style="margin:28px 0 0;font-size:12px;color:#6d8299;line-height:1.5">Biiip Comedy Club — ${escapeHtml(VENUE_FULL_ADDRESS)}<br>Tu reçois cet email suite à ton inscription. Pour faire supprimer tes données, réponds simplement à ce message.</p>
</td></tr></table></td></tr></table></body></html>`;
}

/** Email de bienvenue avec la carte d'adhérent. */
export async function sendWelcomeEmail(
  member: Member,
  cardUrl: string
): Promise<EmailSendResult> {
  const inner = `
<h1 style="font-size:22px;margin:26px 0 6px">Bienvenue au club !</h1>
<p style="margin:0;color:#93a9c2;font-size:15px;line-height:1.5">Ton adhésion gratuite est validée. Montre ta carte à la buvette.</p>
<div style="margin-top:22px;border:1.5px solid #19b2ea;border-radius:16px;padding:20px">
<div style="font-size:11px;letter-spacing:2px;color:#93a9c2;font-weight:700">CARTE D'ADHÉRENT</div>
<div style="font-size:28px;font-weight:700;margin-top:4px">${escapeHtml(member.member_number ?? "")}</div>
<div style="font-size:13px;color:#93a9c2;margin-top:12px">Membre depuis <b style="color:#eaf6ff">${formatJoinDate(member.joined_at)}</b></div>
</div>
<p style="margin:22px 0 0"><a href="${cardUrl}" style="display:inline-block;background:#19b2ea;color:#04131f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Afficher ma carte</a></p>`;
  try {
    const result = await sendDocumentEmail(
      member.email,
      "Ta carte d'adhérent Biiip Comedy Club",
      shell(inner)
    );
    if (!result.ok) {
      console.error("[club-emails] bienvenue échec", result.error);
    } else if (result.simulated) {
      console.warn("[club-emails] bienvenue simulé (pas d’envoi réel)");
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur email";
    console.error("[club-emails] bienvenue", err);
    return {
      ok: false,
      simulated: false,
      brevo_configured: Boolean(process.env.BREVO_API_KEY?.trim()),
      error: message,
    };
  }
}

/** Confirmation de réservation avec lien vers le billet. */
export async function sendReservationEmail(
  resa: SeatReservation,
  show: Show,
  ticketUrl: string
): Promise<EmailSendResult> {
  const places = resa.seats_count > 1 ? `${resa.seats_count} places` : "1 place";
  const inner = `
<h1 style="font-size:22px;margin:26px 0 6px">C'est réservé !</h1>
<p style="margin:0;color:#93a9c2;font-size:15px;line-height:1.5">${escapeHtml(resa.full_name)}, on t'attend.</p>
<div style="margin-top:22px;border:1.5px solid #8fe3ff;border-radius:16px;padding:20px">
<div style="font-size:20px;font-weight:800">${escapeHtml(show.title)}</div>
<div style="font-size:15px;margin-top:8px">${escapeHtml(formatLongDate(show.show_date))} · ${escapeHtml(formatTime(show.start_time))}</div>
<div style="font-size:15px;margin-top:4px">${places} · Entrée gratuite</div>
<div style="font-size:13px;color:#93a9c2;margin-top:12px">Code billet <b style="color:#eaf6ff;letter-spacing:1px">${escapeHtml(resa.ticket_code)}</b></div>
</div>
<p style="margin:22px 0 0"><a href="${ticketUrl}" style="display:inline-block;background:#19b2ea;color:#04131f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Afficher mon billet</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#93a9c2">Un empêchement ? Réponds à cet email pour libérer ta place : la salle ne fait que 19 places.</p>`;
  try {
    const result = await sendDocumentEmail(
      resa.email,
      `Réservation confirmée — ${show.title}`,
      shell(inner)
    );
    if (!result.ok) {
      console.error("[club-emails] réservation échec", result.error);
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur email";
    console.error("[club-emails] réservation", err);
    return {
      ok: false,
      simulated: false,
      brevo_configured: Boolean(process.env.BREVO_API_KEY?.trim()),
      error: message,
    };
  }
}
