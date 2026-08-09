import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://prompt-plus-three.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/v1/admin/", "/dashboard/admin/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/v1/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
