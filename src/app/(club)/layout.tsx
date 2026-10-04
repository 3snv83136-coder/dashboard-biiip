import type { Metadata, Viewport } from "next";
import "./club.css";

export const metadata: Metadata = {
  title: "Biiip Comedy Club",
  description: "Adhésion gratuite et réservation des soirées du Biiip Comedy Club, Toulon.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
};

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="club-root">
      <div className="club-wrap">{children}</div>
    </main>
  );
}
