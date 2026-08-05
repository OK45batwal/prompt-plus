import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://promptplus.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/features",
    "/extension",
    "/enhance-prompt-for-chatgpt",
    "/enhance-prompt-for-claude",
    "/enhance-prompt-for-gemini",
    "/docs",
    "/privacy",
    "/terms",
    "/contact",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
