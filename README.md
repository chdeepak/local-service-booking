# local-service-booking
Some constructs to build a quick service booking platform

---

## Database configuration 🔧

The service reads database configuration from environment variables (in production these are typically provided via GitHub Secrets or your deployment environment). You can provide configuration in one of two ways:

- Set a full connection URL using `DATABASE_URL` (e.g. `postgres://user:password@host:5432/booking`), or
- Provide the individual variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, and `DB_SSL` (set to `"true"` to enable SSL).

Example env vars (GitHub Secrets):

- `DB_HOST`: your-db-host
- `DB_USER`: your-db-user
- `DB_PASSWORD`: your-db-password
- `DB_NAME`: booking
- `DB_PORT`: 5432
- `DB_SSL`: true

The code falls back to `postgres://localhost:5432/booking` when none of the vars are set.
