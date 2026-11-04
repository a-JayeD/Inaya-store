# INAYA Storefront
React + Vite + TS + Tailwind. Shares the Supabase project with `inaya-admin`.

## Setup
1. Run `001_inaya_core.sql` (same file as admin; skip if already applied), then `002_storefront_orders.sql`.
2. `cp .env.example .env` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (anon key only).
3. `npm install && npm run dev`.

## store_settings keys read by the storefront (public: never store secrets here)
`store` {name, tagline, about} · `social` {facebook, instagram, tiktok, whatsapp} · `payment` {bkash, nagad} (receiving numbers) · `page_about|faq|shipping|returns|privacy|terms` {title, body}

## Order safety
Orders are created only by the `place_order` RPC: it re-reads prices, variant and stock with row locks, computes delivery fee from `delivery_zones`, validates coupons, and returns the existing order for a repeated idempotency key. `track_order` needs reference + phone and returns safe fields only. Orders have no public read/write policy.

## Render
Static Site: build `npm install && npm run build`, publish `dist`, rewrite `/*` → `/index.html` (see `render.yaml`). Set the two env vars.
