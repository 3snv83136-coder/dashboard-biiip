import { ClubLogo } from "@/components/club/ClubLogo";
import { formatShowDate, formatTime } from "@/lib/club-format";
import { SHOW_TYPE_LABELS } from "@/lib/constants";
import { getSeatsReservedMap, listBookableShows } from "@/lib/public-store";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Réserver une soirée — Biiip Comedy Club" };

export default async function SpectaclesPage() {
  const shows = await listBookableShows();
  const reserved = await getSeatsReservedMap(shows.map((s) => s._id));

  return (
    <>
      <ClubLogo size={110} />
      <h1 className="club-h1">Prochaines soirées</h1>
      <p className="club-sub">Entrée gratuite, 19 places seulement. Réserve la tienne.</p>

      {shows.length === 0 ? (
        <p className="club-sub" style={{ marginTop: 28 }}>
          Pas de date ouverte pour le moment. Reviens vite !
        </p>
      ) : (
        shows.map((show) => {
          const cap = Number(show.capacity) || 19;
          const left = Math.max(0, cap - (reserved[show._id] ?? 0));
          return (
            <Link key={show._id} href={`/spectacles/${show._id}`} className="club-show">
              <h2>{show.title}</h2>
              <div className="club-chips">
                <span className="club-chip">{formatShowDate(show.show_date)}</span>
                <span className="club-chip">{formatTime(show.start_time)}</span>
                <span className="club-chip">{SHOW_TYPE_LABELS[show.show_type] ?? "Soirée"}</span>
                {left === 0 ? (
                  <span className="club-chip full">Complet</span>
                ) : (
                  <span className="club-chip free">
                    {left} place{left > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          );
        })
      )}

      <p className="club-center" style={{ marginTop: 26 }}>
        <Link href="/adhesion?src=spectacles" className="club-link">
          Adhérer gratuitement au club
        </Link>
      </p>
    </>
  );
}
