/* eslint-disable @next/next/no-img-element */
/** Logo néon officiel du club (même fichier que le site). `size` = largeur en px. */
export function ClubLogo({ size = 150 }: { size?: number }) {
  return (
    <img
      src="/biiip-logo-neon.png"
      alt="Biiip Comedy Club"
      width={size}
      height={Math.round(size * 0.99)}
      className="club-logo"
      style={{ width: size }}
    />
  );
}
