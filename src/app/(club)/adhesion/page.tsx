import { ClubLogo } from "@/components/club/ClubLogo";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Adhérer au Biiip Comedy Club" };

export default function AdhesionPage({
  searchParams,
}: {
  searchParams: { src?: string };
}) {
  const source = (searchParams.src || "site").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  return (
    <>
      <ClubLogo size={140} />
      <h1 className="club-h1">
        Rejoins le club.
        <br />
        C&apos;est gratuit.
      </h1>
      <p className="club-sub">
        Ton email, une case, un bouton. Ta carte d&apos;adhérent s&apos;affiche tout de suite.
      </p>
      <span className="club-badge">⚡ 10 secondes</span>
      <JoinForm source={source || "site"} />
    </>
  );
}
