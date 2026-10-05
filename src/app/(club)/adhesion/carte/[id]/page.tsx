import { ClubLogo } from "@/components/club/ClubLogo";
import { formatJoinDate } from "@/lib/club-format";
import { findMemberById } from "@/lib/public-store";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma carte d'adhérent — Biiip Comedy Club" };

export default async function CartePage({ params }: { params: { id: string } }) {
  const member = await findMemberById(params.id);
  if (!member) notFound();
  const isActive = member.membership_status === "active";

  return (
    <>
      <div className="club-center" style={{ marginTop: 20 }}>
        <div className="club-tick club-cyan">✓</div>
        <h1 className="club-h1" style={{ marginTop: 16 }}>Bienvenue au club !</h1>
        <p className="club-sub">Ton adhésion est validée.</p>
      </div>

      <div className="club-card">
        <ClubLogo size={90} />
        <div className="club-card-role">Carte d&apos;adhérent</div>
        <div className="club-card-num">{member.member_number ?? "—"}</div>
        <div className="club-row">
          <div>
            Membre depuis<b>{formatJoinDate(member.joined_at)}</b>
          </div>
          <div style={{ textAlign: "right" }}>
            Statut
            <b className={isActive ? "club-cyan" : "club-blue"}>{isActive ? "● Actif" : "● Inactif"}</b>
          </div>
        </div>
      </div>

      <p className="club-center" style={{ marginTop: 24, fontSize: 16, fontWeight: 600 }}>
        Montre cette carte à la buvette 🍹
      </p>
      <p className="club-center club-sub" style={{ marginTop: 6, fontSize: 13 }}>
        Un email avec le lien vers ta carte t&apos;a été envoyé (vérifie aussi les spams).
      </p>
      <p className="club-center" style={{ marginTop: 22 }}>
        <Link href="/spectacles" className="club-btn-ghost">
          Voir les prochaines soirées
        </Link>
      </p>
    </>
  );
}
