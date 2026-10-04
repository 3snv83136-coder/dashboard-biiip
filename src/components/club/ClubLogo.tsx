export function ClubLogo({ size = 58 }: { size?: number }) {
  return (
    <span className="club-logo club-pink" style={{ fontSize: size }}>
      BIIIP
      <small className="club-cyan" style={{ fontSize: Math.round(size / 3.05) }}>
        COMEDY CLUB
      </small>
    </span>
  );
}
