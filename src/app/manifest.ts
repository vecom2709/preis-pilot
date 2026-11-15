import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Preis-Pilot – Clever einkaufen. Mehr sparen.",
    short_name: "Preis-Pilot",
    description: "Einkaufslisten, Budget und Preisvergleich mit belegten Preisen.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f7f8",
    theme_color: "#0b3a45",
    lang: "de",
    categories: ["shopping", "finance", "food"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Scannen", url: "/de/scan" },
      { name: "Einkaufslisten", url: "/de/lists" },
    ],
  };
}
