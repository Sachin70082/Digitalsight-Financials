# Digitalsight Financials

A royalty tracking and financial management platform built on **Cloudflare Workers + D1 + R2**.

## Architecture

| Component | Technology |
|-----------|-----------|
| **API Server** | Cloudflare Workers (Hono) |
| **Database** | Cloudflare D1 (SQLite-compatible) |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Frontend** | React + Vite + Tailwind CSS |
| **Auth** | JWT (Web Crypto API via Hono) |

## Project Structure

```
worker/index.ts          # Cloudflare Worker — Hono API server
migrations/0001_init.sql # D1 database schema & seed data
wrangler.toml            # Cloudflare Workers configuration
src/                     # React frontend (SPA)
.dev.vars                # Local development secrets
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Initialize the local D1 database

```bash
npm run db:migrate:local
```

### 3. Start the development servers

Run in **two separate terminals**:

```bash
# Terminal 1: Cloudflare Worker API (port 8787)
npm run dev:worker

# Terminal 2: Vite frontend with HMR (port 5173)
npm run dev:frontend
```

Open `http://localhost:5173` — Vite proxies `/api/*` calls to the Worker.

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Client | `client1` | `client123` |
| Client | `client2` | `client123` |

## Deploy to Cloudflare

  ### 1. Create D1 database
  
  ```bash
  npx wrangler d1 create digitalsight-db
  ```

Copy the `database_id` into `wrangler.toml`.

### 2. Create R2 bucket

```bash
npx wrangler r2 bucket create digitalsight-financials-storage
```

### 3. Set production secret

```bash
npx wrangler secret put JWT_SECRET
```

### 4. Run remote migration

```bash
npm run db:migrate:remote
```

### 5. Deploy

```bash
npm run deploy
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:frontend` | Start Vite dev server (port 5173) |
| `npm run dev:worker` | Start Wrangler dev server (port 8787) |
| `npm run build` | Build frontend to `dist/` |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run db:migrate:local` | Run D1 migration locally |
| `npm run db:migrate:remote` | Run D1 migration on remote |
