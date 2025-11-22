## Veri-Fi Backend

### Overview

This directory contains the **Node.js / TypeScript** backend for Veri-Fi, implemented with **Express**.
It exposes a simple health check and example API endpoint that the Next.js frontend can call.

### Tech stack

- **Runtime**: Node.js 22
- **Language**: TypeScript
- **Framework**: Express

### Endpoints

- `GET /health` – basic health check, returns service status and timestamp.
- `GET /api/example` – example JSON payload (`{ message: "Hello from Veri-Fi backend" }`).

### Getting started (local, without Docker)

From the repo root:

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:4000`.

### Production build

```bash
cd backend
npm install
npm run build
npm run start
```

### Environment

By default, the backend listens on:

- **PORT**: `4000` (configurable via `PORT` environment variable)


