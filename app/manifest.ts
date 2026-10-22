import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "טייוואן 3D | מפת מסע אינטראקטיבית (6.11 – 8.12.2026)",
    short_name: "טייוואן 3D",
    description:
      "מפת תלת-ממד אינטראקטיבית ומדריך לטיול של 33 ימים בטייוואן: ערים, מסלול, אוכל, מלונות וטיפים.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "he",
    background_color: "#0a101d",
    theme_color: "#ff5a36",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
