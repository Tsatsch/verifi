## Veri-Fi

### Overview

This repository contains the **Veri-Fi** application, structured as:

- **frontend/** – Next.js 16 / React 19 / TypeScript frontend.
- **backend/** – Node.js / TypeScript Express backend.

The frontend and backend can be run locally during development or together via Docker/Docker Compose.

### Project structure

- `frontend/` – Next.js App Router app (see `frontend/README.md` for details).
- `backend/` – Express API (see `backend/README.md` for details).
- `docker-compose.yml` – Orchestrates frontend and backend containers.

### Running locally (without Docker)

From the repo root:

#### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

The backend will be available at `http://localhost:4000`.

#### 2. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Running with Docker Compose

From the repo root:

```bash
docker compose up --build
```

This will:

- Build and start the **backend** container on port `4000`.
- Build and start the **frontend** container on port `3000`.

You can then access:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`

To stop the stack:

```bash
docker compose down
```

### Frontend–backend integration

The frontend can communicate with the backend using the environment variable:

- `NEXT_PUBLIC_API_BASE_URL`

In Docker, this is set to `http://backend:4000` via `docker-compose.yml`, where `backend` is the Docker service name.

