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

Local config file

You can also create a local JSON config file at `config/db.local.json` (this file is git-ignored) using `config/db.example.json` as a template. Put your DB values there for local development instead of exporting env vars.

Example (`config/db.local.json`):

```json
{
  "DB_HOST": "your-db-host",
  "DB_USER": "your-db-user",
  "DB_PASSWORD": "your-db-password",
  "DB_NAME": "booking",
  "DB_PORT": "5432",
  "DB_SSL": "false"
}
```

Alternatively, use a `.env` file for local development

- Copy the example: `cp .env.example .env`
- Edit `.env` with your values (do NOT commit it)
- The app loads `.env` automatically in development so `process.env.DATABASE_URL` will be available

Production (EC2 + GitHub Secrets)

- Store your DB connection in **GitHub Secrets** as `DATABASE_URL` (preferred) or individual `DB_*` secrets.
- The GitHub Action and `scripts/deploy.sh` write secrets to `/etc/local-service-booking.env` on the EC2 instance and systemd loads them via `EnvironmentFile`.
- This ensures `process.env.DATABASE_URL` is set when Node runs under systemd.

Example GitHub Secret: `DATABASE_URL=postgres://user:password@your-rds-host:5432/booking`

Note: For stronger security you can use AWS Secrets Manager or SSM Parameter Store and fetch secrets during deploy or at runtime — I can help integrate that if you want.

---

## Viewing logs 🧾

- Local development: run `npm run dev` and watch the terminal output — logs are printed to stdout/stderr.
- Systemd (production on EC2): if you install the provided `scripts/local-service-booking.service`, view logs with:
  - `sudo journalctl -u local-service-booking -f` (follow logs in real time)
- Docker: `docker logs -f <container-id>`

We log full error objects (including stack traces) for DB connection failures and route handlers, so check the app logs when you see `Failed to fetch providers` to find the underlying cause (e.g. missing table, network/auth error).
