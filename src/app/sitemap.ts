

import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: "https://ibids365.com/",
			lastModified: "2026-06-01",
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: "https://ibids365.com/seller/listing",
			lastModified: "2026-06-01",
			changeFrequency: "weekly",
			priority: 2,
		},
		{
			url: "https://ibids365.com/buyer/realestate",
			lastModified: "2026-06-01",
			changeFrequency: "weekly",
			priority: 3,
		},
		{
			url: "https://ibids365.com/buyer/business",
			lastModified: "2026-06-01",
			changeFrequency: "weekly",
			priority: 4,
		},
		{
			url: "https://ibids365.com/buyer/automobile",
			lastModified: "2026-06-01",
			changeFrequency: "weekly",
			priority: 5,
		},
	];
}
