# Soterion — Deployment Guide

Deploy the frontend and backend to a VPS with GitHub Actions auto-deploy on push to `main`.
Soterion is a single (monorepo) GitHub repo, so both services deploy together from one
`docker compose` file — unlike a multi-repo setup, there's only one clone and one workflow.

---

## Architecture Overview

```
GitHub push to main
      │
      ▼
GitHub Actions (appleboy/ssh-action)
      │  SSH
      ▼
VPS (same box as other apps, e.g. FrenzyPay)
  ├── nginx (host, port 80/443) ──── SSL via Let's Encrypt
  │     ├── <your-domain>      ──────────► 127.0.0.1:3001 (soterion-fe container)
  │     └── api.<your-domain>  ──────────► 127.0.0.1:8001 (soterion-be container)
  │
  ├── Docker (soterion-global network)
  │     ├── soterion-fe   (CRA static build served by nginx, port 80 → host 3001)
  │     ├── soterion-be   (FastAPI/uvicorn, port 8001)
  │     └── soterion-db   (MongoDB 7)
  │
  └── /var/www/
        └── soterion/   ← git clone of this repo (backend/, frontend/, docker-compose.yml)
```

Ports `3001`/`8001` are chosen to avoid colliding with other apps already running on the
same VPS (e.g. FrenzyPay uses `3000`/`8080`). Adjust if they're already taken.

---

## Files Created by This Guide

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Single-stage FastAPI/uvicorn production image |
| `backend/.dockerignore` | Excludes `venv/`, `.env`, caches from the build context |
| `backend/.env.example` | Template for the backend's runtime `.env` |
| `frontend/Dockerfile` | 2-stage build (node builder → nginx static server) |
| `frontend/nginx.conf` | In-container nginx config (SPA fallback to `index.html`) |
| `frontend/.dockerignore` | Excludes `node_modules/`, `build/` from the build context |
| `frontend/.env.example` | Template for the frontend's build-time `.env` |
| `docker-compose.yml` | Wires backend + frontend + MongoDB together |
| `.github/workflows/deploy.yml` | Auto-deploy on push to `main` |
| `nginx/soterion.conf` | Host nginx virtual host config (copy to the VPS) |

---

## Step 1 — VPS Initial Setup

If Docker/nginx/git are already installed for another app on this VPS, skip to creating
the Soterion-specific network and directory.

```bash
# Install Docker (skip if already installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install nginx + certbot + git (skip if already installed)
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx git

# Create the Docker network used by Soterion's containers
docker network create soterion-global

# Create the deploy directory
sudo mkdir -p /var/www/soterion
sudo chown -R $USER:$USER /var/www/soterion
```

---

## Step 2 — DNS Configuration

Point these DNS A records to your VPS IP (replace `<your-domain>` with the real domain):

| Record | Type | Value |
|--------|------|-------|
| `<your-domain>` | A | `<your-vps-ip>` |
| `www.<your-domain>` | A | `<your-vps-ip>` |
| `api.<your-domain>` | A | `<your-vps-ip>` |

Wait for DNS propagation (5–30 min) before issuing SSL certificates.

---

## Step 3 — Nginx & SSL Setup

```bash
# Copy the vhost config and edit <your-domain> placeholders first
sudo cp nginx/soterion.conf /etc/nginx/sites-available/soterion.conf
sudo ln -s /etc/nginx/sites-available/soterion.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue SSL certificates (nginx must be running with port 80 open)
sudo certbot --nginx -d <your-domain> -d www.<your-domain>
sudo certbot --nginx -d api.<your-domain>
```

Certbot auto-renews via its systemd timer. Verify with `sudo certbot renew --dry-run`.

---

## Step 4 — Clone the Repo on the VPS

```bash
cd /var/www/soterion
git clone https://github.com/pojokripto/Soterion.git .
```

If the repo is private, use a PAT: `git clone https://<PAT>@github.com/pojokripto/Soterion.git .`

---

## Step 5 — Environment Files on the VPS

These files stay on the VPS only — never commit them to git (already covered by `.gitignore`).

### Backend — `/var/www/soterion/backend/.env`

Copy `backend/.env.example` and fill in real values:

```env
MONGO_INITDB_ROOT_USERNAME=soterion
MONGO_INITDB_ROOT_PASSWORD=<strong-password>
MONGO_URL=mongodb://soterion:<strong-password>@mongo:27017/?authSource=admin
DB_NAME=soterion

EMERGENT_LLM_KEY=<your-emergent-llm-key>
CORS_ORIGINS=https://<your-domain>
```

> The username/password in `MONGO_URL` must match `MONGO_INITDB_ROOT_USERNAME` /
> `MONGO_INITDB_ROOT_PASSWORD` above — this one file configures both the `mongo`
> container's root user and the backend's connection string.
> `MONGO_URL` uses `mongo` as the host (the compose service name), never `localhost`.

### Frontend — `/var/www/soterion/frontend/.env`

Copy `frontend/.env.example` and fill in the real API domain:

```env
REACT_APP_BACKEND_URL=https://api.<your-domain>
```

> **Important:** `REACT_APP_` variables are baked into the JavaScript bundle at
> build time. The `.env` file must exist on the VPS *before* running
> `docker compose up --build` — it's read during the frontend's builder stage,
> not at runtime.

---

## Step 6 — First Deploy (Manual)

```bash
cd /var/www/soterion

# Build and start all three services
docker compose up -d --build

# Verify containers are healthy
docker compose ps

# Check logs
docker logs soterion-be -f
docker logs soterion-fe -f
docker logs soterion-db -f
```

### Reload nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Verify everything is running

```bash
docker ps
curl -I https://<your-domain>
curl https://api.<your-domain>/api/markets
```

---

## Step 7 — GitHub Actions Auto-Deploy

### Add an SSH Deploy Key to the VPS

On your **local machine**, generate a deploy key pair scoped to this repo:

```bash
ssh-keygen -t ed25519 -C "github-actions-soterion" -f ~/.ssh/soterion_deploy -N ""
```

On the **VPS**, add the public key to `authorized_keys`:

```bash
cat >> ~/.ssh/authorized_keys << 'EOF'
<paste contents of ~/.ssh/soterion_deploy.pub here>
EOF
chmod 600 ~/.ssh/authorized_keys
```

> If FrenzyPay already has a deploy key with the same VPS access, you can reuse it
> instead of generating a new one — just add it as a secret on this repo too.

### Add GitHub Secrets

On the `pojokripto/Soterion` repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | SSH username (e.g., `root` or `ubuntu`) |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/soterion_deploy` (the private key) |
| `VPS_PORT` | SSH port (usually `22`) |

### How Auto-Deploy Works

Every push to `main`:
1. GitHub Actions SSHs into the VPS using `appleboy/ssh-action`
2. `git pull origin main` fetches new code
3. `docker compose up -d --build` rebuilds backend + frontend (mongo is untouched
   unless its config changed — Docker skips unchanged image layers)
4. `sudo nginx -t && sudo systemctl reload nginx` reloads nginx config
5. `docker image prune -f` removes dangling images to free disk

The VPS user needs passwordless `sudo` for `systemctl reload nginx`. Grant it (skip if
already granted for another app):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/nginx-reload
```

---

## Day-to-Day Operations

### View logs

```bash
docker logs soterion-be -f --tail 100
docker logs soterion-fe -f --tail 100
docker logs soterion-db -f --tail 100
```

### Restart a service

```bash
docker compose restart backend
docker compose restart frontend
```

### Manual redeploy (without a git push)

```bash
cd /var/www/soterion
git pull origin main
docker compose up -d --build
docker image prune -f
```

### Connect to MongoDB

```bash
docker exec -it soterion-db mongosh -u soterion -p --authenticationDatabase admin
```

### Check disk usage (Docker images accumulate)

```bash
docker system df
docker image prune -f       # remove dangling images
docker system prune -f      # more aggressive cleanup (removes stopped containers too)
```

---

## Troubleshooting

### Container fails to start

```bash
docker inspect soterion-be --format='{{.State.ExitCode}}'
docker logs soterion-be --tail 50
```

Common causes:
- `backend/.env` missing or `MONGO_URL` has wrong host (must be `mongo`, not `localhost`)
- MongoDB not yet healthy (`depends_on: condition: service_healthy` handles this — verify
  with `docker compose ps`)
- Port `8001` or `3001` already in use on the host (check `docker ps` / `ss -tlnp`)

### Frontend build fails or shows blank API URLs

CRA bakes `REACT_APP_` vars at build time. If the browser shows blank/undefined API calls,
`frontend/.env` was missing when `docker compose up --build` ran. Fix:

```bash
cd /var/www/soterion
docker compose up -d --build frontend
```

### SSH permission denied in GitHub Actions

- Verify the private key in `SSH_PRIVATE_KEY` matches the public key in
  `~/.ssh/authorized_keys` on the VPS
- Check `VPS_PORT` is correct
- Test SSH manually: `ssh -i ~/.ssh/soterion_deploy <VPS_USER>@<VPS_HOST>`

### nginx 502 Bad Gateway

```bash
docker ps | grep soterion
curl http://127.0.0.1:3001   # frontend
curl http://127.0.0.1:8001   # backend
```

### SSL certificate errors

```bash
sudo certbot certificates
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```
