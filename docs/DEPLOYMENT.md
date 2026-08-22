# Obaaratech Bible AI — Production Deployment

## Architecture

- React/Vite frontend
- Fastify API
- PostgreSQL + Prisma 7
- AI provider called only from the server
- Admin authentication in an HTTP-only cookie
- Full WEBU Scripture corpus stored in PostgreSQL after import

## Bible corpus

This release includes the **World English Bible Updated (WEBU)** USFM source files from eBible.org. eBible.org identifies WEBU as public domain. The name “World English Bible” is a trademark of eBible.org; do not alter the actual text and continue to call an altered text the World English Bible. See `data/webu/SOURCE.txt` and the official source page for the current terms.

Official source: https://ebible.org/bible/details.php?all=1&id=engwebu

The included USFM package contains additional Deuterocanonical/Apocryphal books as well, but this application's production schema currently imports the standard 66-book Protestant canon. The unused source files are retained for future support if desired.

## Before launch

1. Create a production PostgreSQL database.
2. Generate a strong JWT secret.
3. Generate the admin password hash:
   `npm run admin:hash -- "YOUR-STRONG-PASSWORD"`
4. Set all required environment variables from `.env.example`.
5. Set `COOKIE_SECURE=true` and serve the site over HTTPS.
6. Install dependencies:
   `npm install`
7. Generate Prisma client:
   `npm run db:generate`
8. Create/update the production schema:
   `npm run db:push`
9. Import the full WEBU 66-book corpus:
   `npm run db:import-webu -- --replace`
10. Build:
    `npm run build`
11. Start the API:
    `npm start`
12. Serve `frontend/dist` over HTTPS. Recommended routing:
    - `/` → static `frontend/dist`
    - `/api/*` → Fastify on port 4000
13. Verify:
    - `/health`
    - `/admin/login`
    - Bible search
    - Bible AI
    - Bible Vibes
    - Kids Bible
    - Sermon Prep
    - logout/session expiry
14. Configure backups, monitoring, privacy policy, terms and an AI-use disclosure.

### Do not run `npm run db:seed` for the production Bible corpus

`db:seed` is intentionally a tiny development seed. Production should use the WEBU importer above.

## Same-domain deployment (recommended)

Use Nginx/Caddy or your hosting platform's reverse proxy:

- `/` → `frontend/dist`
- `/api/` → `http://127.0.0.1:4000`

Set:
`VITE_API_URL=""`
and
`FRONTEND_ORIGIN="https://bible.obaaratech.com.ng"`

This avoids browser CORS complexity.

## Separate API subdomain

If the API is hosted at `https://api.bible.obaaratech.com.ng`, set:
`VITE_API_URL="https://api.bible.obaaratech.com.ng"`
and
`FRONTEND_ORIGIN="https://bible.obaaratech.com.ng"`

Enable HTTPS on both domains.

## Production checklist

- [ ] Production PostgreSQL created
- [ ] Strong admin password hash generated
- [ ] JWT secret set
- [ ] AI key stored only on the server
- [ ] `COOKIE_SECURE=true`
- [ ] WEBU corpus imported with `--replace`
- [ ] Search tested with Genesis 1:1 and John 3:16
- [ ] AI tested with a Scripture question
- [ ] Admin login tested
- [ ] HTTPS enabled
- [ ] Backups configured
- [ ] Privacy/terms/AI disclosure published
