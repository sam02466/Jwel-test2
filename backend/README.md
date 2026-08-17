# Sarika Beauty Hub — Backend API

A Next.js API-only backend (App Router route handlers + Prisma/PostgreSQL)
for the Sarika Beauty Hub jewellery storefront, admin console, and
delivery-agent app. This project has **no pages of its own** — the
storefront/admin/agent UI is the separate `frontend/` project (Vite +
React) that calls this API.

## Where this came from

This backend started as a real, working backend for an unrelated sweet
shop e-commerce app (Next.js + Prisma + Postgres, real bcrypt auth, real
Razorpay integration, real QR-based delivery handover). Rather than
build a jewellery backend from scratch, that project was **reused and
adapted**:

**Reused essentially unchanged** — `lib/auth.ts`, `lib/agent-auth.ts`
(JWT + httpOnly cookie pattern), `lib/prisma.ts`, `lib/rate-limit.ts`,
`lib/cors.ts`, `lib/qr-token.ts`, `lib/razorpay.ts`, `lib/sms.ts`,
`lib/push.ts`, `lib/api-response.ts`; the admin/agent login-logout-me
routes; `/api/payments/*`; `/api/upload`; `/api/push/subscribe`.

**Adapted** — `prisma/schema.prisma` (jewellery `Category` enum in
place of sweets categories; a 5-step `OrderStatus` flow the frontend's
tracker already expected instead of the sweet shop's prep-kitchen
stages; `Product` gained jewellery fields — `mrp`, `badge`, `rating`,
`images[]`, `details`); the orders/products API routes; `lib/pricing.ts`
(flat delivery charge -> always-free shipping, matching the storefront's
"Complimentary insured shipping" copy); `lib/validation.ts` and
`lib/notifications.ts` for the new domain; money is stored in **whole
rupees**, not paise — the jewellery frontend's price formatting already
assumed rupees everywhere, so keeping that convention meant the display
layer needed zero changes (only `lib/razorpay.ts`'s caller converts to
paise, the one place that actually talks to Razorpay).

**Added — genuinely missing before** — a real `Customer` model +
`lib/customer-auth.ts` + `/api/customer/*` (signup/login/logout/me/
orders). The sweet shop had **no customer accounts at all** (guest
checkout by phone only); the jewellery frontend already shipped a full
sign-up/sign-in UI (`Auth.jsx`) wired to nothing but `localStorage` —
this is what makes it real. Also added: `DELETE /api/admin/agents/[id]`
(soft-delete, wasn't needed in the sweet shop's admin UI), a real
`/api/admin/customers` (queries the new `Customer` table directly
instead of deriving a list from guest orders by phone); real
transactional email via Brevo (`lib/email.ts` — welcome email on
signup, order-confirmation email on payment/COD); real address
geocoding via OpenStreetMap Nominatim (`lib/geocode.ts`) in place of a
random nearby coordinate; and real live agent GPS tracking
(`PATCH /api/agent/location`, `Order.agentLatitude/agentLongitude`) —
see "Delivery map: real address, real GPS" below for the last two.

**Removed** — `OrderType`/`PICKUP` (this shop is delivery-only), the
sweet shop's own Next.js pages/components (the jewellery frontend
replaces them entirely), Tailwind/fonts (nothing here renders a page
that needs them).

## Architecture: two projects, one API

```
frontend/   Vite + React storefront/admin/agent UI  (this is what a
            person actually opens in a browser)
backend/    This project — Next.js, JSON API only
```

**Local development** — run both dev servers side by side (backend
on :3000, frontend's Vite dev server on :5173). The frontend's
`vite.config.js` proxies `/api/*` to `http://localhost:3000`, so from
the browser's point of view every request is same-origin — cookies work
normally, no CORS configuration needed for the authenticated routes.

**Production** — deploy both under **one domain**, with `/api/*` routed
to this backend and everything else to the built frontend (a reverse
proxy, or your host's path-based routing/rewrites — e.g. Vercel
rewrites, an Nginx `location /api/`, etc.). Same-origin in production is
what makes the admin/agent/customer cookies work without loosening CORS
— see `lib/cors.ts`'s comment for why permissive CORS is applied *only*
to the couple of routes that are unauthenticated by design (product
list, single-order lookup).

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and the three JWT secrets at minimum
npx prisma generate
npx prisma migrate deploy   # applies both migrations in prisma/migrations/
npm run db:seed             # creates admin, 3 agents, a demo customer, the 24-piece catalogue, and a few sample orders
npm run dev                 # http://localhost:3000
```

Payments (Razorpay), push notifications (VAPID), and image upload
(Vercel Blob) are each optional — the rest of the app works without
them; those specific features return a clear error until configured.

### Demo credentials (from `prisma/seed.ts`)

| Role | Username | Password |
|---|---|---|
| Admin | `admin@sarikabeautyhub.in` | `admin123` |
| Delivery agent | `rahul.verma@sarikadelivery.in` (or the other two seeded agents) | `agent123` |
| Customer | `demo@sarikabeautyhub.in` | `demo123` |

Change these (edit `prisma/seed.ts` and re-seed) before using anything
but a throwaway local database.

## API surface

- `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]`
- `POST /api/orders` (create — guest or signed-in customer), `GET /api/orders` (`?phone=` for guest lookup, or admin-only full list), `GET /api/orders/[id]` (public, unguessable id)
- `PATCH /api/orders/[id]/status`, `PATCH /api/orders/[id]/assign`, `POST /api/orders/[id]/verify-qr`
- `POST /api/customer/{signup,login,logout}`, `GET/PATCH /api/customer/me`, `GET /api/customer/orders`
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`, `GET/POST /api/admin/agents`, `DELETE /api/admin/agents/[id]`, `GET /api/admin/customers`, `GET /api/admin/dashboard`
- `POST /api/agent/login`, `POST /api/agent/logout`, `GET /api/agent/me`, `GET /api/agent/orders`, `PATCH /api/agent/location`
- `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/webhook`
- `POST /api/upload` (admin, product images), `POST /api/push/subscribe`
- `GET /api/geocode/reverse` (public, powers the checkout page's "Use my current location")

Every response is `{ success: true, data }` or `{ success: false, message }` / `{ success: false, errors: [...] }` (422 validation errors) — see `lib/api-response.ts`.

## QR delivery handover

Each order gets a random 24-byte `qrToken` at checkout — **not** the
customer's phone number, which is how the original localStorage
prototype this was built from encoded it (an easily-guessable scheme).
`OrderReceipt.jsx` renders `SARIKA|{orderId}|{qrToken}` as a QR code;
the agent's app scans (or manually enters) that string, and
`POST /api/orders/[id]/verify-qr` is what actually authorizes marking
the order delivered — the token match is the real access control; the
requirement that the caller be an admin or the specifically-assigned
agent is defense-in-depth on top of it.

## Delivery map: real address, real GPS

Two separate things used to be faked here and are now real:

- **The destination pin** used to be a random coordinate from a fixed
  list of Kolkata landmarks, assigned to every order regardless of its
  actual address. `POST /api/orders` now geocodes the real
  `addressLine1`/`addressCity`/`addressPincode` via OpenStreetMap's free
  Nominatim API (`lib/geocode.ts`) — no API key needed, and it uses the
  same map data as the OSM tiles `OrderMap.jsx` already renders. If
  geocoding fails (bad address, Nominatim briefly down), the order still
  goes through — `Order.latitude`/`longitude` just stay `null` and the
  map shows "location not available yet" rather than a fake pin.
  Nominatim's public instance is rate-limited (~1 req/s) and asks for a
  descriptive User-Agent (both honored in `lib/geocode.ts`) — fine for
  "geocode once per order," not meant for heavy commercial volume. Swap
  in a paid geocoder (Google, Mapbox, LocationIQ) if that becomes an
  issue; only `geocodeAddress()`'s body would need to change.
- **The agent's position** is now real, live GPS, not a static
  assignment. `PATCH /api/agent/location` (agent-authenticated) accepts
  `{lat, lng}` and fans it out to every order that agent currently has
  `OUT_FOR_DELIVERY`. The frontend's `src/lib/geolocation.js` wraps
  `navigator.geolocation.watchPosition`, throttled to send at most once
  every ~15s, wired up on `AgentOrderDetail.jsx` behind an explicit
  "Start sharing" toggle (off by default — a delivery agent's live
  position is sensitive, so this asks rather than tracking silently in
  the background). `OrderMap.jsx` was also rewritten to update markers
  in place instead of tearing down and recreating the whole map on every
  position change, which is what made continuous updates viable at all.
- **Admin and customer can now see it too.** `AdminOrders.jsx` shows the
  tracking map (destination + live agent dot) inside each order's
  expanded row, and polls `refreshOrders()` every 20s while the page is
  open so it doesn't go stale. The customer's `OrderReceipt.jsx` shows
  the same map — with a "Live" badge — whenever their order is
  assigned/out for delivery, polling the single-order endpoint every 15s
  for exactly as long as the order stays `OUT_FOR_DELIVERY` (the polling
  effect's own dependency on the order's status is what stops it once
  the order's delivered — no separate cleanup needed). Both reuse the
  same `agentCoords`/`coords` fields every order response already
  carries (`lib/order-mapper.ts`) — no new endpoint was needed for this
  part, only the frontend views.
- **Checkout can also fill the address from GPS now.** A new
  `GET /api/geocode/reverse?lat=&lng=` (public, rate-limited, same
  reasoning as the other public lookups) wraps `reverseGeocode()` in
  `lib/geocode.ts` — Nominatim coordinates-to-address, the mirror of the
  `geocodeAddress()` used at order creation. `Checkout.jsx`'s "Use my
  current location" button calls `navigator.geolocation.getCurrentPosition`
  once (not a continuous watch — checkout only needs one fix) and sends
  it here to prefill the address line/city/PIN code. Every field it
  fills stays editable; a reverse geocode is a best guess (house-number-
  level accuracy varies a lot by area — dense cities do well, rural
  addresses may only resolve to a village name), not a guarantee.

## Known limitations

- **SMS is still a stub** (`lib/sms.ts`) — logs to the console instead
  of sending anything. Email (`lib/email.ts`) is real now, via Brevo —
  see `.env.example`. Wire up a real SMS provider (MSG91/Twilio) the
  same way when ready; the call sites are already in place.
- **Rate limiting is in-memory**, per server process — fine for a single
  instance, resets on redeploy, doesn't share state across multiple
  instances/regions. Swap for Redis/Upstash before relying on it at
  scale.
- **No automated tests.**
- This backend was written and adapted in a sandbox **with no network
  access** — it has not been run against a live database, a real
  Razorpay account, Brevo, or Nominatim. The SQL migrations were
  hand-written to match `prisma/schema.prisma` exactly (rather than
  generated by `prisma migrate dev` against a live DB) for the same
  reason. Review before deploying, and expect to fix small issues on
  first run.
