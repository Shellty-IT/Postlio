# Postlio

AI-driven Progressive Web App for managing multi-platform social media presence — Facebook, Instagram and LinkedIn — from a single dashboard. Postlio combines a fully autonomous publishing pipeline (Autopilot AI) with an interactive content workshop (Kreator AI), so brands and creators can move from idea to published post without leaving the app.

> **Production**
> - Frontend: <https://postlio.netlify.app>
> - Backend API: <https://postlio-backend.onrender.com>

---

## Table of contents

- [Application modes](#application-modes)
- [Tech stack](#tech-stack)
- [Account model & publishing](#account-model--publishing)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running tests](#running-tests)
- [CI / CD](#ci--cd)
- [Contributing](#contributing)

---

## Application modes

Postlio ships with two distinct modes, sharing the same content pipeline but differing in level of automation.

### Autopilot AI
A scheduled, multi-agent loop that researches topics, drafts posts, generates accompanying media, queues the publication, and pushes to the right channel via Graph / LinkedIn APIs. Designed for business accounts where end-to-end automation is acceptable and desired.

- Multi-agent planning (research → copywriting → visual → scheduling)
- APScheduler-driven cadence per brand
- Per-platform budgets, tone presets and guard-rails
- Full audit log of every generated and published item

### Kreator AI
An interactive workspace for personal accounts and review-heavy workflows. The user steers the agent step-by-step, regenerates assets on demand and chooses the moment of publication.

- Prompt-first editor with regenerate-and-iterate UX
- Side-by-side preview for Facebook / Instagram / LinkedIn formats
- Manual publish through the platform's native Share Dialog
- Save-to-library for later reuse

---

## Tech stack

### Frontend — `postlio_frontend/`
- **Next.js 14.2** (App Router) + **TypeScript 5**
- **Tailwind CSS 3** with the in-house **"Liquid Depth"** design system (dark/light mode, glass-morphism surfaces, gradient typography, Floating Island Navigation, AI Pulse Indicator)
- **Shadcn/UI** primitives over Radix
- **Zustand** for client state, **TanStack Query 5** for server state
- **Framer Motion 11** for transitions
- **React Hook Form + Zod** for forms and validation
- **PWA**: custom Service Worker + Web App Manifest, installable on desktop and mobile
- Hosted on **Netlify**

### Backend — `postlio_backend/`
- **FastAPI 0.110** on **Python 3.11**, async end-to-end
- **PostgreSQL** via **Neon**, **SQLAlchemy 2.0** (async) + **asyncpg**
- **Alembic** for schema migrations
- **APScheduler** for Autopilot's recurring jobs
- **python-jose** + **passlib/bcrypt** for auth, Fernet-style encryption for stored OAuth tokens
- **httpx** as the single HTTP client for AI providers and social APIs
- Hosted on **Render**

### AI providers
| Modality | Default | Fallback / alternative |
|----------|---------|------------------------|
| Text | Google **Gemini 2.5 Flash** | **Groq** (Llama 3.3) |
| Image | **Pollinations** (Flux, GPT-Image-1 Mini) | **HuggingFace** (Stable Diffusion XL) |
| Video | **Pollinations Seedance Lite** (text-to-video only) | — |

### Social & auth integrations
- **Facebook Graph API v18.0** (pages, scheduled publishing, insights)
- **Instagram Graph API** (business / creator accounts)
- **LinkedIn Marketing API** (company pages, UGC posts)
- **OAuth login**: Facebook, Google

---

## Account model & publishing

Postlio recognises three account types. Capabilities differ by the access each platform exposes to third parties.

| Account type | Platforms | Autopilot | Auto-publish | Notes |
|--------------|-----------|-----------|--------------|-------|
| **Business** | `facebook_page`, `instagram_business`, `instagram_creator`, `linkedin_company` | ✅ | ✅ via Graph / LinkedIn APIs | Full pipeline, scheduled posting, insights |
| **Personal** | `facebook_personal`, `instagram_personal`, `linkedin_personal` | ❌ | ❌ (platforms forbid it) | Kreator AI only; publish through Share Dialog |
| **Demo** | none | ❌ | ❌ | Generate and save drafts without connecting any account |

Platform limitations are enforced at the API layer — the UI degrades gracefully so personal-account users see "Open share dialog" instead of "Publish now".

---

## Repository layout

```
Postlio/
├── postlio_backend/         FastAPI service (Python 3.11)
│   ├── app/
│   │   ├── api/v1/          REST endpoints (ai, auth, autopilot, brands, posts, social)
│   │   ├── models/          SQLAlchemy 2.0 ORM models
│   │   ├── schemas/         Pydantic request/response schemas
│   │   ├── services/        Domain logic (AI managers, publishing, scheduling)
│   │   ├── workers/         APScheduler jobs
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/             Migrations (8 revisions)
│   ├── tests/               pytest (unit + integration)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pytest.ini
├── postlio_frontend/        Next.js 14 PWA (TypeScript)
│   ├── src/
│   │   ├── app/             App Router pages & layouts
│   │   ├── components/      UI + feature components
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/       React Query, theme, auth providers
│   │   ├── store/           Zustand slices
│   │   └── types/
│   ├── e2e/                 Playwright specs
│   ├── public/              PWA assets (manifest, icons, sw)
│   ├── jest.config.js
│   ├── playwright.config.ts
│   ├── next.config.mjs
│   └── tailwind.config.ts
├── .github/workflows/       CI pipelines (backend.yml, frontend.yml)
├── .gitignore
├── README.md
└── README_PL.md
```

---

## Getting started

The backend and frontend are independent services and can be started in either order. For day-to-day development you'll usually want both running.

### Prerequisites
- **Node.js 20 LTS** and npm
- **Python 3.11**
- A reachable **PostgreSQL** database (Neon free tier works)

### Backend

```bash
cd postlio_backend
python -m venv .venv
.venv\Scripts\activate          # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env            # then fill it in
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

API will be available at `http://localhost:8000` with interactive docs at `/docs`.

### Frontend

```bash
cd postlio_frontend
npm install
cp .env.local.example .env.local

npm run dev
```

The PWA boots at `http://localhost:3000` and talks to the backend via `NEXT_PUBLIC_API_URL`.

---

## Environment variables

### Backend (`postlio_backend/.env`)

```env
# Core
DEBUG=false
SECRET_KEY=<32+ char random string>
DATABASE_URL=postgresql+asyncpg://user:pass@host/postlio
FRONTEND_URL=http://localhost:3000

# Token encryption (Fernet key, 32 url-safe base64 bytes)
TOKEN_ENCRYPTION_KEY=

# AI — text
GOOGLE_API_KEY=
GROQ_API_KEY=
DEFAULT_TEXT_PROVIDER=gemini

# AI — image
POLLINATIONS_API_KEY=
HUGGINGFACE_API_KEY=
DEFAULT_IMAGE_PROVIDER=pollinations

# Meta (Facebook + Instagram Graph)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_API_VERSION=v18.0

# LinkedIn Marketing
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Frontend (`postlio_frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In CI and in production hosts (Render, Netlify) the same names are provided through the platform's secret store — see [CI / CD](#ci--cd) below.

---

## Running tests

### Backend (`pytest`)

```bash
cd postlio_backend
pytest                          # full suite
pytest -m unit                  # only unit tests
pytest -m integration           # only integration tests
pytest --cov=app --cov-report=term-missing
```

Markers are declared in `pytest.ini`: `unit`, `integration`, `slow`, `external`. CI runs `unit + integration` and skips `external`.

### Frontend

```bash
cd postlio_frontend

# Jest + React Testing Library
npm run test
npm run test:coverage
npm run test:ci                 # used in CI (--ci --coverage --maxWorkers=2)

# Playwright E2E
npm run test:e2e
npm run test:e2e:chromium       # single browser, faster locally
npm run test:e2e:report         # open last HTML report
```

Playwright is configured for Chromium, Firefox, WebKit and the two mobile presets.

---

## CI / CD

Workflows live in `.github/workflows/` and run on every push and every pull request that touches the relevant subtree.

| Workflow | Triggered by | Stages |
|----------|--------------|--------|
| `backend.yml` | Changes under `postlio_backend/**` | Ruff lint → pytest (unit + integration) on Python 3.11 with a PostgreSQL service container → coverage upload |
| `frontend.yml` | Changes under `postlio_frontend/**` | Type-check → ESLint → Jest (CI) → `next build` → Playwright E2E (Chromium) → artifact upload |

Secrets are read from **GitHub Actions secrets** (`DATABASE_URL`, `SECRET_KEY`, `TOKEN_ENCRYPTION_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `POLLINATIONS_API_KEY`, `HUGGINGFACE_API_KEY`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_API_URL`).

Deployments are handled by the hosting providers themselves:
- **Render** auto-deploys `postlio_backend/` on every successful push to `main`
- **Netlify** auto-deploys `postlio_frontend/` on every successful push to `main`

---

## Contributing

1. Create a feature branch off `main`: `git checkout -b feat/<short-slug>`.
2. Keep changes scoped — backend-only or frontend-only PRs are easier to review.
3. Run the relevant test suite locally before pushing.
4. Open a PR against `main`; CI must be green to merge.
5. Use Conventional Commits-style messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).

For larger architectural changes, open an issue first so we can align on the approach.
