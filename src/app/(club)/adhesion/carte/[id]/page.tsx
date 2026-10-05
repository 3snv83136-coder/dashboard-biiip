import { ClubLogo } from "@/components/club/ClubLogo";
import { MemberCardSave } from "@/components/club/MemberCardSave";
import { formatJoinDate } from "@/lib/club-format";
import { findMemberById } from "@/lib/public-store";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const member = await findMemberById(params.id);
  const title = member?.member_number
    ? `Carte ${member.member_number} — Biiip`
    : "Ma carte d'adhérent — Biiip Comedy Club";
  return {
    title,
    appleWebApp: {
      capable: true,
      title: "Carte Biiip",
      statusBarStyle: "black-translucent",
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export default async function CartePage({ params }: { params: { id: string } }) {
  const member = await findMemberById(params.id);
  if (!member) notFound();
  const isActive = member.membership_status === "active";
  const memberNumber = member.member_number ?? "adherent";

  return (
    <>
      <div className="club-center" style={{ marginTop: 20 }}>
        <div className="club-tick club-cyan">✓</div>
        <h1 className="club-h1" style={{ marginTop: 16 }}>
          Bienvenue au club !
        </h1>
        <p className="club-sub">Ton adhésion est validée.</p>
      </div>

      <MemberCardSave memberNumber={memberNumber}>
        <div className="club-card">
          <ClubLogo size={90} />
          <div className="club-card-role">Carte d&apos;adhérent</div>
          {member.full_name ? (
            <div className="club-card-name">{member.full_name}</div>
          ) : null}
          <div className="club-card-num">{member.member_number ?? "—"}</div>
          <div className="club-row">
            <div>
              Membre depuis
              <b>{formatJoinDate(member.joined_at)}</b>
            </div>
            <div style={{ textAlign: "right" }}>
              Statut
              <b className={isActive ? "club-cyan" : "club-blue"}>
                {isActive ? "● Actif" : "● Inactif"}
              </b>
            </div>
          </div>
        </div>
      </MemberCardSave>

      <p
        className="club-center"
        style={{ marginTop: 24, fontSize: 16, fontWeight: 600 }}
      >
        Montre cette carte à la buvette
      </p>
      <p className="club-center club-sub" style={{ marginTop: 6, fontSize: 13 }}>
        Le lien de ta carte est aussi dans ton email — garde-le précieusement.
      </p>
      <p className="club-center" style={{ marginTop: 22 }}>
        <Link href="/spectacles" className="club-btn-ghost">
          Voir les prochaines soirées
        </Link>
      </p>
    </>
  );
}
