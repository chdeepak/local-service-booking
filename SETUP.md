# Production Setup with DATABASE_URL

## Overview
This application uses a single `DATABASE_URL` environment variable for PostgreSQL connection. No individual DB credentials needed.

## Local Development

1. **Set DATABASE_URL**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/booking"
   ```

2. **Create database and tables**
   ```bash
   psql "$DATABASE_URL" < migrations/001_create_providers.sql
   ```

3. **Run dev server**
   ```bash
   npm run dev
   ```

## Production Deployment

### Prerequisites
- Ubuntu 22.04 LTS (or similar) EC2 instance
- PostgreSQL database (RDS or self-hosted)
- GitHub secrets configured:
  - `EC2_HOST` - EC2 instance IP/domain
  - `EC2_USER` - SSH user (usually `ubuntu`)
  - `EC2_PRIVATE_KEY` - SSH private key
  - `DATABASE_URL` - Full PostgreSQL connection string

### GitHub Secrets Setup
Add this to your GitHub repo settings (Settings → Secrets and variables → Actions):

```
DATABASE_URL=postgresql://user:password@mydb.xxxxx.us-east-1.rds.amazonaws.com:5432/booking
EC2_HOST=54.123.45.67
EC2_USER=ubuntu
EC2_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...key content...
-----END RSA PRIVATE KEY-----
```

### Deployment
Just push to main branch - GitHub Actions will:
1. Checkout code
2. SSH to EC2
3. Run deploy.sh with DATABASE_URL
4. Deploy and restart services

Deploy script automatically:
- Installs Node.js, Nginx, Git
- Builds TypeScript
- Creates `/etc/local-service-booking/.env` with DATABASE_URL
- Configures systemd service
- Sets up Nginx reverse proxy
- Tests health endpoint

### Manual EC2 Setup (if needed)
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Export DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run deploy script
bash -s < <(curl -s https://raw.githubusercontent.com/chdeepak/local-service-booking/main/scripts/deploy.sh)
```

## Environment & Service

**Systemd Service**: `/etc/systemd/system/local-service-booking.service`
- Reads DATABASE_URL from `/etc/local-service-booking/.env`
- Auto-restarts on failure
- Runs on port 3000

**Nginx**: Reverse proxy on port 80
- Forwards to localhost:3000
- Config: `/etc/nginx/sites-available/local-service-booking`

## API Endpoints

```bash
# Health check
curl http://localhost/health

# Get all providers
curl http://localhost/providers

# Create provider
curl -X POST http://localhost/providers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Plumber"}'

# Get provider
curl http://localhost/providers/1

# Update provider
curl -X PUT http://localhost/providers/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Plumber Pro"}'

# Delete provider
curl -X DELETE http://localhost/providers/1
```

## Database

First time setup - run migration on your database:
```bash
psql "$DATABASE_URL" < migrations/001_create_providers.sql
```

The pool is created on first query, so no explicit connection needed in code.

## Troubleshooting

### Check service status
```bash
sudo systemctl status local-service-booking
sudo journalctl -u local-service-booking -f
```

### Check Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Verify environment
```bash
sudo cat /etc/local-service-booking/.env
```

### Test database connection
```bash
psql "$DATABASE_URL" -c "SELECT 1"
```
