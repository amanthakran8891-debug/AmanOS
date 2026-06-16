# AmanOS — private subdomain deployment (`life.bharatfare.com`)

AmanOS stays a **standalone app**. It is **not** merged into the BharatFare routes, so the public site's bundle, build, and performance are completely untouched. This deploys AmanOS to its own origin with single-user auth, no indexing, and its own database.

## What's already wired (no action needed)
- **Single-user auth gate** — `src/middleware.ts` redirects every route to `/login` unless a valid signed session cookie is present. Login takes one password (`AMANOS_PASSWORD`); the session is an HMAC-SHA256 cookie (`src/lib/auth.ts`), edge-compatible. Logout is in Settings.
- **No indexing** — `next.config.mjs` sends `X-Robots-Tag: noindex, nofollow, noarchive` on **every** response, and `src/app/robots.ts` returns `Disallow: /`.
- **PWA** — `public/manifest.webmanifest` (`scope`/`start_url` = `/`, standalone, dark theme) installs cleanly on the subdomain on Android and iOS.

## 1. Separate Neon database (keep it isolated from BharatFare)
Create a **new Neon project** (or a new database/branch) just for AmanOS — do **not** reuse BharatFare's database.
```bash
# locally, against the new AmanOS DB
cp .env.example .env
#  set DATABASE_URL to the AmanOS POOLED Neon URL (host contains "-pooler")
npx prisma migrate deploy      # creates AmanOS tables in the new DB
npm run db:seed                # creates the Settings row
```

## 2. Environment variables (set these in Vercel / on the VPS)
```
DATABASE_URL   = postgresql://…-pooler…neon.tech/amanos?sslmode=require   # AmanOS DB only
AMANOS_PASSWORD= <a long, unique password — the only login>
AMANOS_SECRET  = <run: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))">
```

## 3a. Deploy on Vercel (recommended — simplest)
1. Import this repo as a **new, separate Vercel project** (do not touch the BharatFare project).
2. Add the three env vars above (Production + Preview).
3. Build command is `prisma generate && next build` (already in `package.json`). Deploy.
4. **Domain:** Vercel → Project → Domains → add `life.bharatfare.com`. Vercel shows a DNS record.
5. **DNS:** at your domain provider, add a **CNAME** `life` → `cname.vercel-dns.com` (Vercel will show the exact target). SSL is automatic.
6. After first deploy, migrations already ran in step 1; if you skipped it, run `DATABASE_URL=<prod> npx prisma migrate deploy && npm run db:seed` once.

## 3b. Deploy on the VPS + nginx (optional alternative)
Run AmanOS as its own PM2 process on a free port (e.g. 3100) — **separate from `bharatfare-app`**, so BharatFare is never touched.
```bash
# on the VPS
git clone <repo> /var/www/amanos && cd /var/www/amanos
cp .env.example .env            # fill DATABASE_URL, AMANOS_PASSWORD, AMANOS_SECRET
npm ci
npx prisma migrate deploy && npm run db:seed
npm run build
PORT=3100 pm2 start "npm run start" --name amanos
pm2 save
```
nginx vhost for the subdomain:
```nginx
server {
  server_name life.bharatfare.com;
  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
# DNS: A record  life.bharatfare.com -> <VPS IP>
sudo certbot --nginx -d life.bharatfare.com    # free SSL
sudo nginx -t && sudo systemctl reload nginx
```
This is a second, isolated process and vhost; the public BharatFare app, its build, and its performance are unaffected.

## 4. Verify after deploy
```bash
# 1) gate works — any route redirects to /login when logged out
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://life.bharatfare.com/"        # 307 -> /login
# 2) noindex header present on every response
curl -s -I "https://life.bharatfare.com/login" | grep -i x-robots-tag                          # noindex, nofollow, noarchive
# 3) robots disallow
curl -s "https://life.bharatfare.com/robots.txt"                                               # Disallow: /
# 4) login with AMANOS_PASSWORD → dashboard loads; install the PWA from the browser menu
```

## 5. Updating AmanOS (VPS) — after pushing new code
```bash
cd /var/www/amanos
git pull
npm install
npm run build
pm2 restart amanos        # PM2 app name is "amanos"
```
If you changed the Prisma schema: `npx prisma migrate deploy` before `npm run build`.

## 6. Deployment cleanup checklist (confirm once)
```bash
pm2 list | grep amanos                                   # app name is exactly "amanos"
curl -s -I "https://life.bharatfare.com/login" | grep -i x-robots-tag    # noindex, nofollow, noarchive (set in next.config + nginx if you also added it there)
curl -s "https://life.bharatfare.com/robots.txt"          # User-agent: *  Disallow: /
```
- App-level noindex ships from `next.config.mjs` (`X-Robots-Tag` on every response) — so it works even on Vercel. If you *also* want it at the nginx layer (belt-and-braces), add to the `location /` block:
  `add_header X-Robots-Tag "noindex, nofollow, noarchive" always;` then `sudo nginx -t && sudo systemctl reload nginx`.

## Notes
- **Single user:** only `AMANOS_PASSWORD` can log in. Keep it long and private. Rotating `AMANOS_SECRET` invalidates all existing sessions (forces re-login) — useful if a device is lost.
- **Isolation:** AmanOS has its own repo, build, DB, domain, and process. There is no shared code, bundle, middleware, or table with public BharatFare — zero performance or data coupling.
