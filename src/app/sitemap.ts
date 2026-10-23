import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config/env";

const baseUrl = appUrl();

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
