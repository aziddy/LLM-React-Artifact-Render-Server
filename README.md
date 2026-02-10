# LLM React Artifact Render Server

A self-hosted platform for storing and rendering LLM-generated React/JSX artifacts. Paste code from Claude or other LLMs, and view live-rendered previews in a sandboxed iframe.

## Features

- **Artifact CRUD** — create, edit, delete, and search artifacts
- **Live preview** — Babel-transpiled JSX rendered in a sandboxed iframe with React, Recharts, Tailwind CSS, and Lucide icons
- **Visibility controls** — public or private per artifact
- **JWT authentication** — simple username/password login
- **CodeMirror editor** — syntax-highlighted JSX editing
- **SQLite storage** — zero-config, file-based database
- **Docker ready** — multi-stage build with persistent volume

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · SQLite (better-sqlite3) · CodeMirror 6 · Framer Motion

## Quick Start

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
JWT_SECRET=your-secret-key-here
```

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker compose up -d
```

This builds the app, exposes port 3000, and persists the SQLite database in a named volume.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth` | — | Login, returns JWT |
| GET | `/api/artifacts` | Optional | List artifacts (public only if unauthenticated) |
| POST | `/api/artifacts` | Required | Create artifact |
| GET | `/api/artifacts/[id]` | Optional | Get artifact by ID |
| PUT | `/api/artifacts/[id]` | Required | Update artifact |
| DELETE | `/api/artifacts/[id]` | Required | Delete artifact |
| GET | `/api/artifacts/by-slug/[slug]` | Optional | Get artifact by slug |
| GET | `/render/[slug]` | Optional | Render artifact as HTML |
