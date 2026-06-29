// // import 'dotenv/config';
// import { defineConfig } from 'drizzle-kit';

// export default defineConfig({
//   out: './drizzle',
//   schema: './src/db/schema.ts',
//   dialect: 'sqlite',
//   driver: 'd1-http',
//   dbCredentials: {
//     accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
//     databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
//     token: process.env.CLOUDFLARE_D1_TOKEN!,
//   },
// });


import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

const isProd = process.env.NODE_ENV === "production";

const prodCredentials = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
  token: process.env.CLOUDFLARE_API_TOKEN!, // renamed for clarity
};

const localCredentials = {
  databaseId: "local",
  // url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/DB.sqlite" // uncomment if you use Miniflare locally
} as const;

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  out: "./drizzle/migrations",
  dbCredentials: isProd ? prodCredentials : (localCredentials as any),
});
