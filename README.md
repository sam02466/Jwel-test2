# Sarika Beauty Hub

Two projects, deployed together:

- **`backend/`** — Next.js API (Prisma/PostgreSQL). Real auth, real
  Razorpay payments, real QR delivery handover, real customer accounts.
  Adapted from a sweet-shop backend of the same architecture.
- **`frontend/`** — the storefront/admin/agent app (Vite + React) you
  already had, rewired to call that real API instead of localStorage.

Start with **`backend/README.md`** — it explains what was reused,
what was adapted, what was genuinely missing and got added (customer
accounts/sign-up above all), and exactly how the two projects connect
to each other in dev and in production. `frontend/README.md` covers
the frontend-side half of that same story.

## Quick start

```bash
# Terminal 1
cd backend
npm install && cp .env.example .env   # fill in DATABASE_URL + the 3 JWT secrets
npx prisma generate && npx prisma migrate deploy && npm run db:seed
npm run dev            # http://localhost:3000

# Terminal 2
cd frontend
npm install
npm run dev             # http://localhost:5173 — proxies /api to the backend
```

Then open http://localhost:5173. Demo logins are in both READMEs.

## Before you deploy

Neither project has actually been run — this was all written in a
sandbox with no network access (no `npm install`, no live database, no
real Razorpay/Brevo/Nominatim traffic to test against). Both READMEs
list this explicitly under "Known limitations," along with the one
remaining unfinished piece (SMS is still a stub that logs to the
console — email now sends for real via Brevo). Expect to fix a few
small issues on first run, and review the security/architecture notes
in `backend/README.md` before this touches real customer data or
money.
