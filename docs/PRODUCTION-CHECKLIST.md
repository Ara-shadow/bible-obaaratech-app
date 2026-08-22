# Production checklist

- [ ] Replace sample Bible corpus with a properly licensed translation.
- [ ] Import Bible books/passages and validate every reference.
- [ ] Import TSK cross-references from a suitable public-domain source.
- [ ] Connect the production AI provider server-side.
- [ ] Use a long random JWT secret (32+ characters; preferably 64+ random bytes).
- [x] Admin password authentication uses a salted scrypt hash stored in an environment variable.
- [ ] Enable HTTPS and secure cookies.
- [ ] Restrict CORS to the production origin.
- [ ] Add persistent rate limiting at the reverse proxy/API layer.
- [ ] Add request logging and error monitoring without logging sensitive user content unnecessarily.
- [ ] Add backup/restore for PostgreSQL.
- [ ] Add privacy policy, terms, content disclaimer and AI-use disclosure.
- [ ] Review crisis-resource copy for Nigeria and the countries you intend to serve before launch.
- [ ] Test mobile, accessibility, search, admin publishing and AI failure states.
- [ ] Configure `bible.obaaratech.com.ng` and production API routing.
