# Postlio — CLAUDE.md

## What is Postlio

Postlio is a mobile-first PWA for managing social media presence across
Facebook, Instagram, and LinkedIn. It enables small businesses and creators to
create, schedule, and auto-publish content from a single dashboard. The core
feature is an AI engine (Gemini + Groq + Pollinations) that generates platform-
tailored text posts, images, and video, and can run fully autonomously via
**Autopilot** mode.

**Project status:** Early active development.

## Repository & Hosting

- GitHub: https://github.com/Shellty-IT/Postlio
- Backend: Render — https://postlio-backend.onrender.com
- Frontend: Netlify — https://postlio.netlify.app
- Database: Neon (PostgreSQL serverless)
- Monorepo — `postlio_backend/` (Python) + `postlio_frontend/` (Next.js)

## Stack

### Backend (`postlio_backend/`)

| Layer | Technology |
|-------|-----------|
| Runtime | Python 3.11 |
| Framework | FastAPI 0.110 (fully async) |
| ORM / DB | SQLAlchemy 2.0 (async) + asyncpg + Neon PostgreSQL |
| Migrations | Alembic (8 revisions) |
| Scheduling | APScheduler (Autopilot jobs, runs every minute) |
| Auth | python-jose (JWT) + passlib/bcrypt + Fernet (token encryption) |
| HTTP client | httpx |
| Testing | pytest (unit, integration, slow, external markers) |
| CI | GitHub Actions (`.github/workflows/backend.yml`) |

### Frontend (`postlio_frontend/`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 3 — "Liquid Depth" design (glass-morphism, dark/light) |
| UI primitives | Shadcn/UI (Radix) |
| State | Zustand (UI/local) + TanStack Query 5 (server state) |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion 11 |
| PWA | Custom Service Worker + Web App Manifest |
| Testing | Jest + React Testing Library + Playwright |
| CI | GitHub Actions (`.github/workflows/frontend.yml`) |

### AI Providers

| Modality | Default | Fallback |
|----------|---------|---------|
| Text | Google Gemini 2.5 Flash | Groq (Llama 3.3) |
| Image | Pollinations (Flux / GPT-Image-1 Mini) | HuggingFace (Stable Diffusion XL) |
| Video | Pollinations Seedance Lite | — |

## Account Model

Three account types determine available features:

| Type | Platforms | Auto-publish | Notes |
|------|-----------|-------------|-------|
| **Business** | facebook_page, instagram_business, instagram_creator, linkedin_company | Yes (Graph API) | Full Autopilot |
| **Personal** | facebook_personal, instagram_personal, linkedin_personal | No (Share Dialog) | Kreator AI only |
| **Demo** | — | No | Generate/save drafts without connection |

## Architecture

```
postlio_backend/app/
  api/v1/
    auth.py          # Register, login, OAuth (Facebook/Google), token refresh
    ai.py            # Text/image/video generation, providers list
    autopilot.py     # Config CRUD, queue management, generation, publishing
    brands.py        # Brand profiles with Voice DNA (JSON)
    posts.py         # Manual post CRUD, bulk publish
    social.py        # Social account connect/disconnect, OAuth callbacks
  models/
    user.py          # User + OAuth fields + trial + onboarding
    brand.py         # Brand + voice_dna (JSON) + colors + industry
    post.py          # Post + platforms (JSONB) + platform_statuses (JSONB)
    autopilot.py     # AutopilotConfig + AutopilotQueueItem
    social_account.py # SocialAccount + encrypted tokens + refresh logic
  services/
    ai/
      text/          # base, gemini, groq_provider, manager (fallback logic)
      image/         # base, pollinations, huggingface, gemini_image, manager
      video/         # base, pollinations, manager
    social/
      facebook.py, instagram.py, linkedin.py, google.py
      encryption.py  # Fernet token encryption/decryption
      manager.py     # Platform routing
    autopilot_service.py   # Generation logic, queue management
    publish_service.py     # Auto vs manual publish per account type
    scheduler_service.py   # APScheduler jobs (check schedules, publish queue)
  schemas/           # Pydantic DTOs (user, brand, post, autopilot, ai, social)
  config.py          # All settings, env vars, AI defaults
  database.py        # Async PostgreSQL session, test mode
  main.py            # App bootstrap, lifespan, health, router registration

postlio_frontend/src/
  app/
    (auth)/          # login, register, onboarding
    (dashboard)/     # dashboard, creator, calendar, autopilot, brands,
                     # saved-posts, settings
    (marketing)/     # features/* landing pages
  components/
    creator/         # post-editor, post-preview, ai-chat-panel, image-crop-modal
    autopilot/       # config-panel, queue, stats, schedule-config
    brands/          # brand-form, voice DNA radar, tone-slider
    calendar/        # month/week views, droppable-day, drafts-sidebar
    dashboard/       # stats-cards, platform-stats, recent-posts
    layout/          # sidebar, top-bar, floating-nav, notifications-dropdown
    saved-posts/     # draft library
    pwa/             # install prompt, offline indicator, update banner
  hooks/             # useAI, useAuth, useAutopilot, useBrands, usePosts,
                     # useSocial, useWarmup, usePWA
  store/             # Zustand: auth, autopilot, brands, calendar, settings, ui
  lib/api/           # API client + per-resource modules (ai, auth, autopilot,
                     # brands, posts, social) + shared types
  providers/         # auth, query, theme providers
  types/             # Shared TS interfaces
```

## Key Models

### Post
```python
content (Text), image_url (Text — base64 or URL), image_prompt
platform (string), platforms (JSONB array), platform_statuses (JSONB)
status: draft | scheduled | publishing | published | failed
ai_generated, ai_model, generation_params (JSONB)
scheduled_at, published_at
likes, comments, shares
```

### AutopilotConfig
```python
brand_id (unique per brand), is_active, is_paused
posts_per_week, schedule_days, schedule_time, timezone
platforms, social_account_mapping (JSON: {platform → account_id})
categories, auto_publish_on_approve
creativity_level (0-100), post_length (short|medium|long)
include_images, include_hashtags, include_emoji
text_provider, image_provider, image_style
Stats: total_generated, total_approved, total_rejected, total_published, streak_days
```

### AutopilotQueueItem
```python
status: pending | approved | rejected | published | failed | scheduled
scheduled_for, published_at, platform_post_id, platform_post_url
publish_error, publish_attempts (max 3), last_publish_attempt_at
social_account_id (nullable FK → SocialAccount)
```

### SocialAccount
```python
platform, account_type (facebook_page, instagram_business, etc.)
access_token (Text, Fernet-encrypted), refresh_token, token_expires_at
page_id, page_access_token (Facebook pages)
instagram_account_id, connected_fb_page_id
is_token_expired (bool), connection_status (enum), posts_published
```

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/register` | Email/password |
| POST | `/login` | Returns JWT access + refresh tokens |
| POST | `/oauth/init/{platform}` | Start Facebook or Google OAuth |
| POST | `/oauth/callback/{platform}` | Handle OAuth code |
| POST | `/refresh` | Rotate access token |
| GET | `/me` | Current user |
| POST | `/onboarding/complete` | Mark onboarding done |
| POST | `/onboarding/skip` | Skip to demo mode |

### AI (`/api/v1/ai`)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/providers` | List available text/image/video providers |
| POST | `/generate/text` | Generate post text |
| POST | `/generate/variations` | N variations of content |
| POST | `/improve` | Improve existing text |
| POST | `/chat` | Interactive AI refinement |
| POST | `/generate/image` | Generate image |
| POST | `/generate/video` | Generate video |

### Posts, Brands, Autopilot, Social — full CRUD + publishing
See `app/api/v1/` for full details.

## Key Technical Decisions

### Token encryption
OAuth access/refresh tokens stored encrypted at rest using Fernet symmetric
encryption. Key: `TOKEN_ENCRYPTION_KEY` env var. Decrypted only at publish time.
→ `services/social/encryption.py`

### Autopilot scheduler
APScheduler runs two background jobs every minute:
1. Check generation windows → create queue items
2. Check publication windows → publish approved items (max 3 retries)
Fire-and-forget; publish errors logged and stored in `publish_error` field.

### AI provider fallback
Text: Gemini → Groq. Image: Pollinations → HuggingFace. Fallback triggered
automatically when primary provider fails. Provider selectable per-request.
→ `services/ai/text/manager.py`, `services/ai/image/manager.py`

### Multi-platform post
Single post can target multiple platforms simultaneously via `platforms` JSONB
array. Each platform's status tracked independently in `platform_statuses` JSONB.
→ `models/post.py`, migration `006`

### image_url as Text
`image_url` is a `Text` column (not `String(500)`) to support full base64-encoded
image data, not just URLs.
→ migration `007`

### Personal vs Business publishing
Business accounts: direct API calls (Facebook Graph, LinkedIn Marketing API).
Personal accounts: content prepared + Share Dialog URL + step-by-step
instructions sent to user — no API token required.
→ `services/publish_service.py`

### Brand Voice DNA
JSON schema attached to each brand: tone settings, writing style, keywords,
target audience, guidelines. Applied to every AI generation call for that brand.
Visualised in frontend as tone slider + radar chart.
→ `models/brand.py`, `api/v1/brands.py`

### Cold start (Render)
Backend hosted on Render free tier → cold starts. `useWarmup` hook in frontend
pings `/health` on app load to pre-warm the instance.
→ `hooks/useWarmup.ts`

## Environment Variables

### Backend (`.env`)
```
DEBUG=false
SECRET_KEY=...               # JWT signing secret
DATABASE_URL=...             # Neon PostgreSQL DSN
FRONTEND_URL=https://postlio.netlify.app
TOKEN_ENCRYPTION_KEY=...     # Fernet key for OAuth token encryption

GOOGLE_API_KEY=...           # Gemini text generation
GROQ_API_KEY=...             # Groq/Llama fallback
DEFAULT_TEXT_PROVIDER=gemini

POLLINATIONS_API_KEY=...     # Image / video generation
HUGGINGFACE_API_KEY=...      # Image fallback
DEFAULT_IMAGE_PROVIDER=pollinations

FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_API_VERSION=v18.0

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

GOOGLE_CLIENT_ID=...         # Google OAuth login
GOOGLE_CLIENT_SECRET=...
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=https://postlio-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://postlio.netlify.app
```

## Database Migrations

8 Alembic revisions (never modify existing):
1. `001_initial_schema` — users, brands, posts, social_accounts
2. `002_add_autopilot_tables` — AutopilotConfig, AutopilotQueueItem
3. `003_update_social_accounts` — token encryption, additional fields
4. `004_autopilot_social_integration` — social_account_mapping, publish tracking
5. `005_user_onboarding_trial` — trial_ends_at, onboarding fields
6. `006_posts_multi_platform` — platforms (JSONB), platform_statuses
7. `007_image_url_to_text` — image_url Text (base64 support)
8. `008_add_oauth_fields` — OAuth provider fields

Run: `alembic upgrade head` (inside `postlio_backend/`)

## CI/CD

**Backend** (`.github/workflows/backend.yml`):
triggered on changes to `postlio_backend/` → Ruff lint → pytest (unit +
integration) → upload coverage → auto-deploy to Render on main

**Frontend** (`.github/workflows/frontend.yml`):
triggered on changes to `postlio_frontend/` → tsc → ESLint → Jest CI →
next build → Playwright E2E → auto-deploy to Netlify on main

## Project Status

**Done:**
- Auth: email/password + OAuth (Facebook + Google)
- Brand management with Voice DNA
- Kreator AI: text generation, image generation, video, chat/improve, variations
- Multi-platform post creation and preview
- Autopilot: config, schedule, topic rotation, queue, approve/reject, publish
- Social account connection: Facebook (page), Instagram (business/creator), LinkedIn (company)
- Calendar: month/week view, drag-drop scheduling, drafts sidebar
- Saved posts / draft library (tab: saved-posts)
- Publish time picker with clock for hour selection
- "Publish now" option in Kreator AI alongside "Publish manually"
- Dashboard: stats, recent posts, AI activity
- PWA: installable, service worker, offline indicator
- 14-day trial + onboarding flow

## Pending

### Fixes to implement

- **Post category click** — clicking a category tag should APPEND text to
  existing content, not replace it
- **Character counter in Kreator AI** — add live counter, enforce limit of ~1000
  characters (verify max tokens AI can reliably process and adjust limit)
- **Link preview (OG metadata)** — when a URL is pasted into the post editor,
  fetch and display Open Graph title/description/image (like WhatsApp/Messenger)
- **Image resize handles** — uploaded image should support drag-resize / aspect
  ratio cropping in the editor (image-crop-modal.tsx)
- **Dark mode login page styling** — review contrast/legibility of login and
  register pages in dark theme

### Future considerations
- Serilog / Application Insights equivalent for Python (structured logging)
- Smoke test after deploy in CI
- SignalR / WebSocket for real-time Autopilot queue updates
- Verify Facebook + LinkedIn OAuth on production end-to-end
- Cold start mitigation beyond useWarmup (consider Render paid tier or keep-alive cron)

## Git & Commit Rules

- Agent does **not** commit, push, create PRs, or merge without an explicit instruction.
- After finishing work the agent always asks: "Commit and push?"
- Commit messages: conventional commits, short, plain English.
  Examples: `feat: add character counter to post editor`,
            `fix: append category text instead of replacing`
- No `Co-Authored-By`, no AI mentions, no emoji in commits or branch names.
- Branch names: short, lowercase, English, hyphens.

## Coding Rules

- No dead code, no comments in code.
- Backend: log via Python `logging` / FastAPI logger — not `print()`.
- Frontend: use `src/app/(dashboard)/` for protected page routes.
- New DB columns = new Alembic revision. Never modify existing migrations.
- AI provider calls always go through the manager (with fallback) — never
  call a provider directly from a route.
- OAuth tokens always stored Fernet-encrypted — never plaintext.
