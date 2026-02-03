import type { MetadataRoute } from "next";

import { env } from "@/env";

const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  return routes;
}
