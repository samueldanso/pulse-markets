import type { MetadataRoute } from "next";

import { env } from "@/env";

const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
