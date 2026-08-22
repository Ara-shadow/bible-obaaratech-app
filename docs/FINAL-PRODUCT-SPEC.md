# Obaaratech Bible — Final Product Specification

## Brand
Blue and white Obaaratech identity. Clean, calm, highly readable Bible experience. No prototype-style placeholder UI.

## Public areas
1. Home
2. Bible Reader
3. Bible Search
4. Bible AI
5. Bible Vibes
6. Kids Bible
7. Sermon Preparation
8. Devotionals / Articles
9. Bible Reading Plans
10. About / Contact

## Account areas
- Register
- Login
- Forgot/reset password
- My Bible dashboard
- Bookmarks
- Personal notes
- Reading progress
- Saved sermon preparations
- Saved AI conversations
- Reading-plan progress
- Profile/settings
- Logout

## Admin
- Super Admin login
- Dashboard
- Bible Vibes CRUD
- Kids Bible CRUD
- Devotionals/articles CRUD
- Reading plans CRUD
- User management
- Editor management
- Site settings
- Audit-friendly role separation

## Core security
- Password hashing
- HTTP-only auth cookies/tokens
- CSRF protection where cookie-authenticated mutations are used
- Rate-limited login
- Input validation
- Parameterized database queries
- Protected admin routes
- Upload validation
- Production secrets only in environment variables
- HTTPS in production

## WEBU
The application is prepared to use the uploaded World English Bible Updated (WEBU) USFM corpus. The import must be run against the production PostgreSQL database before public launch. Preserve the public-domain attribution/licensing information bundled with the project.

## Performance
- No heavy background video
- Lazy-load non-critical images
- Use compressed WebP/AVIF images where appropriate
- Paginate admin lists
- Server-side Bible search
- Database indexes on book/chapter/verse/search fields
- Cache safe public content
- Keep AI keys server-side
