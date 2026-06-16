import type { MetadataRoute } from "next";

// AmanOS is private. Disallow all crawling on the whole subdomain.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
