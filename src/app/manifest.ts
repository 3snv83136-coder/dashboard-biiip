import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dashboard Biiip",
    short_name: "Biiip",
    description:
      "Back-office du Biiip Comedy Club — programmation, artistes, contacts, avis et médias.",
    start_url: "/accueil",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#031029",
    theme_color: "#1e5eff",
    lang: "fr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
