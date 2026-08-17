# Sarika Beauty Hub — Frontend

The storefront, admin console, and delivery-agent app (Vite + React,
Tailwind, react-router-dom). This is the UI half of the project — it
has no data of its own and talks entirely to the separate `backend/`
project's JSON API. See `../backend/README.md` for the full story of
where that backend came from and how the two are meant to be deployed
together.

## What changed to make this real

The page components (`src/pages/**`) and shared UI (`src/components/**`)
are almost entirely untouched — this was already a well-built frontend,
just wired to nothing. What changed is the **data layer**:

- `src/data/store.js` used to be the entire "database" (localStorage
  reads/writes for products, orders, customers, agents, sessions). It's
  now just the genuinely client-only bits: the shopping cart and a
  small "recently viewed order ids" list for guest order tracking.
- `src/context/AuthContext.jsx` and `src/context/DataContext.jsx` were
  rewritten to call the real API (`src/lib/api.js`) instead of
  localStorage. Their exported hook shapes (`useAuth()`, `useData()`)
  were kept as close to the original as possible, so most pages needed
  no changes at all.
- `src/lib/api.js` (new) — a small fetch wrapper; `src/lib/razorpay.js`
  (new) — loads and opens the real Razorpay Checkout widget;
  `src/lib/geolocation.js` (new) — wraps `navigator.geolocation.watchPosition`
  with throttling for the agent's live-location sharing.
- A handful of pages *did* need edits, because their original logic was
  fundamentally synchronous/local and had to become real async
  server calls: `Checkout.jsx` (real order creation + payment, replacing
  a fake `setTimeout`), `Home.jsx` (was reading a hardcoded product
  array instead of the live catalogue — a real bug, now fixed),
  `Account.jsx`, `AgentOrderDetail.jsx`'s QR verification and live
  location sharing, `AdminProducts.jsx` / `AdminProductForm.jsx` /
  `AdminAgents.jsx` (create/update/delete now hit the API),
  `OrderReceipt.jsx` (falls back to fetching its order directly for a
  guest who just checked out), and the three login/signup forms (submit
  handlers made `async`). `AdminLayout.jsx` / `AgentPortal.jsx` /
  `AgentOrderDetail.jsx` also needed their redirect-to-login guards to
  wait for the async session check to finish, so an already-logged-in
  admin/agent doesn't get bounced on every page refresh.
- `OrderMap.jsx` was rewritten to take a real geocoded `destination` and
  an optional live `agentPosition`, updating markers in place instead of
  recreating the whole Leaflet map on every coordinate change (needed
  once the agent's position can update every ~15s). It's now used in
  three places: the agent's own `AgentOrderDetail.jsx` (with the
  "Start/Stop sharing" toggle), the admin's `AdminOrders.jsx` (inside
  each order's expanded row, for orders that have a destination or a
  live agent position — the page polls every 20s to stay current), and
  the customer's `OrderReceipt.jsx` (shown once an order is assigned or
  out for delivery, polling every 15s for as long as it stays out for
  delivery).
- `Checkout.jsx` gained a "Use my current location" button next to the
  address fields — one-shot GPS (not continuous, unlike the agent's live
  sharing), reverse-geocoded server-side via the new
  `GET /api/geocode/reverse`, prefilling the address line/city/PIN code.
  Every field stays editable, since a reverse geocode is a best guess.

## Setup

```bash
npm install
npm run dev   # http://localhost:5173
```

Requires the backend running too — see `../backend/README.md`.
`vite.config.js` proxies `/api/*` to `http://localhost:3000` so the two
act as one origin in development (this is what makes the httpOnly
session cookies work without CORS).

### Demo logins

Same accounts `backend/prisma/seed.ts` creates — the hint text already
shown on each login page:

| Portal | URL | Credentials |
|---|---|---|
| Storefront | `/auth` | `demo@sarikabeautyhub.in` / `demo123`, or "Create an account" |
| Admin | `/admin/login` | `admin@sarikabeautyhub.in` / `admin123` |
| Delivery agent | `/agent/login` | any seeded agent email / `agent123` |

## Known limitations

- **Brief loading flash on cold load.** Sessions live in httpOnly
  cookies the JS can't read, so `AuthContext` has to ask the backend
  "am I logged in?" on every page load before it knows for sure. For
  roughly one network round-trip, `isCustomer`/`isAdmin`/`isAgent` are
  all `false` — pages that use these to decide what to show
  (`Navbar.jsx`'s Sign In/Account link, for instance) may flash the
  signed-out state briefly. The pages that would actually *break* from
  this (redirect loops, blank forms) were fixed to wait for the check;
  purely cosmetic flashes elsewhere were left as-is.
- **The cart is still client-only** (localStorage) — this is a
  deliberate choice, not a leftover gap: there's no reason a
  not-yet-purchased cart needs a server round-trip, and it means adding
  something to cart still works instantly offline.
- **Any location prompt needs HTTPS.** Like the QR scanner's camera
  access, `navigator.geolocation` — used both by the agent's live
  sharing and by Checkout's "Use my current location" button — only
  works in a secure context: `https://` in production, or `localhost` in
  dev (which is exempt). Testing over plain HTTP on any other host will
  silently fail to prompt for permission.
- Same payment/SMS/geocoding limitations as the backend — see
  `../backend/README.md` "Known limitations".
- Written and adapted in a sandbox with **no network access**, so
  `npm install` has not actually been run against this `package.json`
  and the app has not been loaded in a browser. Review before deploying.
