# Obaaratech Bible AI

A production-oriented foundation for the Bible AI platform at `bible.obaaratech.com.ng`.

## Included

- Bible AI chat with safeguard layer
- Crisis gate before normal AI responses
- Bible search with PostgreSQL full-text search
- AI-assisted search expansion
- Sermon preparation with cross-reference support
- Daily Bible Vibes
- Children's Bible Stories
- Admin authentication and content management
- Rate limiting and strict input validation
- PostgreSQL + Prisma
- React/Vite frontend
- AI provider kept server-side

## Bible corpus and licensing

This release includes the World English Bible Updated (WEBU) USFM source files. eBible.org identifies WEBU as public domain. The application imports the standard 66-book Protestant canon by default. See `data/webu/SOURCE.txt` and `docs/DEPLOYMENT.md` for attribution and import instructions.

The name “World English Bible” is a trademark of eBible.org. Do not alter the actual text and continue to call an altered text the World English Bible.

The repository also retains additional WEBU source files for future Deuterocanonical/Apocrypha support.

For development, `npm run db:seed` still creates only a tiny sample. For production use `npm run db:import-webu -- --replace`.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH`. Generate the password hash with `npm run admin:hash -- "your-strong-password"`.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npm run db:push`.
6. Run `npm run db:seed`.
7. Run `npm run dev`.

Frontend: http://localhost:5173  
API: http://localhost:4000

## AI

Set `AI_ENABLED=true`, `AI_API_KEY`, `AI_API_URL`, and `AI_MODEL` when ready. The server uses an OpenAI-compatible chat-completions endpoint, so the provider can be changed without exposing the key to the browser.

## Production

Use a real secrets manager/environment variables, HTTPS, a strong admin password, a real JWT secret, a production database, and a licensed Bible corpus. Put the API behind the same domain or a controlled API subdomain and configure `FRONTEND_ORIGIN` accordingly.


Admin UI: `/admin/login`. The production frontend defaults to same-origin API calls; use `VITE_API_URL` only when the API is on a separate origin.
