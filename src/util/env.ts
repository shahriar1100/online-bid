// src/util/env.ts
export const runtime = "edge";

export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  COOKIE_NAME: process.env.SESSION_COOKIE_NAME || "edge_session",
  COOKIE_SECURE: process.env.NODE_ENV === "production",

  // Cloudflare D1 (via Wrangler API)
  CF_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
  CF_D1_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID!,
  CF_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN!,

  // For API calls from Next.js server
  WRANGLER_API_URL: process.env.WRANGLER_API_URL!,

  // For API calls directly from frontend
  NEXT_PUBLIC_WRANGLER_API_URL: process.env.NEXT_PUBLIC_WRANGLER_API_URL!,
  FRONTEND_BASE_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_SERVER || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 465,
  SMTP_USER: process.env.SMTP_USERNAME || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM_EMAIL: process.env.FROM_EMAIL || "",
  SMTP_FROM_NAME: "IBIDS",

  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "developers@ibids365.com",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  // R2
  R2_BUCKET: process.env.CLOUDFLARE_R2_BUCKET || "auction-hive-assets",
  R2_PREVIEW_BUCKET: process.env.CLOUDFLARE_R2_PREVIEW_BUCKET || "auction-hive-assets",
  R2_PREVIEW_BUCKET_URL: process.env.CLOUDFLARE_R2_BUCKET_PREVIEW_URL || "https://pub-925e11758c384112b352fa4ab58ba020.r2.dev",

};
