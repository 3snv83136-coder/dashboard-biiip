import "./spectacle.css";

export default function MaFicheLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="spectacle-root">{children}</div>;
}
