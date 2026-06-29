# IBIDS
> Real-time auction platform with live bidding and Stripe payments (Cloudflare-native).

---

## Stack

Next.js · Cloudflare Workers · Durable Objects · D1 · R2 · Stripe

---

## Prerequisites

* Node.js ≥ 18

* pnpm

* Cloudflare account

* Wrangler CLI

  ```bash
  npm install -g wrangler
  ```

* Stripe CLI (for local webhooks)

  ```bash
  npm install -g stripe
  ```

---

## 1. Install

```bash
pnpm install
```

---

## 2. Environment

Create `.env.local`:

```env
JWT_SECRET=your-secret

FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_WRANGLER_API_URL=http://localhost:8787

CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=will-be-generated
CLOUDFLARE_API_TOKEN=your-api-token

CLOUDFLARE_R2_BUCKET=auction-hive-assets
CLOUDFLARE_R2_PREVIEW_BUCKET=auction-hive-assets
CLOUDFLARE_R2_BUCKET_PREVIEW_URL=https://<your-bucket>.r2.dev

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

SMTP_SERVER=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=
```

---

## 3. Cloudflare Setup

### 3.1 Login

```bash
wrangler login
```

---

### 3.2 Create D1 Database

```bash
wrangler d1 create ibids-db
```

Copy the `database_id` and update `wrangler.jsonc`:

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "ibids-db",
    "database_id": "<PASTE_ID_HERE>",
    "migrations_dir": "drizzle/migrations"
  }
]
```

Run migrations:

```bash
npx drizzle-kit push
```

---

### 3.3 Create R2 Bucket

```bash
wrangler r2 bucket create auction-hive-assets
```

Update `wrangler.jsonc`:

```json
"r2_buckets": [
  {
    "binding": "MY_BUCKET",
    "bucket_name": "auction-hive-assets"
  }
]
```

Enable public access (required for media URLs):

* Cloudflare Dashboard → R2 → bucket → **Public access ON**

---

### 3.4 Configure Durable Objects

```json
"durable_objects": {
  "bindings": [
    {
      "name": "AUCTION_ROOM",
      "class_name": "AuctionRoom"
    }
  ]
},
"migrations": [
  {
    "tag": "v1",
    "new_sqlite_classes": ["AuctionRoom"]
  }
]
```

---

### 3.5 Set Secrets (Workers)

```bash
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

---

## 4. Run Locally

### Start backend (Worker)

```bash
wrangler dev
```

Runs on:

```
http://localhost:8787
```

---

### Start frontend

```bash
pnpm dev
```

Runs on:

```
http://localhost:3000
```

---

### Stripe Webhooks (required)

```bash
stripe listen --forward-to http://localhost:8787/api/webhook
```

Copy the webhook secret → update `.env.local`

---

## 5. Deployment

### Deploy backend (Workers)

```bash
pnpm deploy:workers
```

---

### Deploy frontend (Pages)

```bash
pnpm deploy:pages
```

---

## System

Next.js → Workers → Durable Object (`AuctionRoom`)
            ↘ D1 (data) · R2 (assets)

---

## Core Behavior

* Durable Object handles **auction state, bid ordering, and concurrency**
* Prevents race conditions during live bidding
* D1 stores users, listings, bids, payments
* R2 stores uploaded media
* Stripe handles payments + verification

---

## Endpoints (Core)

* `POST /auth/signup`
* `POST /auth/login`
* `POST /api/bids`
* `GET /api/bids/:type/:id`
* `POST /api/payment/create-order`
* `POST /api/payment/verify`

---

## Notes

* Do NOT use KV for transactional data (D1 is used)
* Auction state is computed + enforced via Durable Objects
* Migrations: `drizzle/migrations`
