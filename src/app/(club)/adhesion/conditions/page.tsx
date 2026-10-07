import { ClubLogo } from "@/components/club/ClubLogo";
import {
  MEMBERSHIP_TERMS_BODY,
  MEMBERSHIP_TERMS_SUBTITLE,
  MEMBERSHIP_TERMS_TITLE,
  MEMBERSHIP_TERMS_VERSION,
} from "@/lib/membership-terms";

export const metadata = {
  title: "Règlement intérieur — Biiip Comedy Club",
};

export default function ConditionsPage() {
  return (
    <>
      <ClubLogo size={90} />
      <h1 className="club-h1">{MEMBERSHIP_TERMS_TITLE}</h1>
      <p className="club-sub">{MEMBERSHIP_TERMS_SUBTITLE}</p>
      <p className="club-sub">Version du {MEMBERSHIP_TERMS_VERSION}</p>
      <div className="club-terms">{MEMBERSHIP_TERMS_BODY}</div>
    </>
  );
}
