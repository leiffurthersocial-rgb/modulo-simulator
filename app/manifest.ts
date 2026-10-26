import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Modulo Simulator",
    short_name: "Modulo",
    description: "A text-based life simulator. Life, mod N.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef0f7",
    theme_color: "#6d4aff",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
