# Postlio

Aplikacja PWA wspierana przez AI, służąca do zarządzania obecnością w social mediach na wielu platformach jednocześnie — Facebook, Instagram i LinkedIn — z jednego pulpitu. Postlio łączy w pełni autonomiczny pipeline publikacji (Autopilot AI) z interaktywnym warsztatem treści (Kreator AI), dzięki czemu marki i twórcy przechodzą od pomysłu do opublikowanego posta bez wychodzenia z aplikacji.

> **Produkcja**
> - Frontend: <https://postlio.netlify.app>
> - Backend API: <https://postlio-backend.onrender.com>

---

## Spis treści

- [Tryby aplikacji](#tryby-aplikacji)
- [Stack technologiczny](#stack-technologiczny)
- [Architektura kont i publikacji](#architektura-kont-i-publikacji)
- [Struktura projektu](#struktura-projektu)
- [Pierwsze kroki](#pierwsze-kroki)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Uruchamianie testów](#uruchamianie-testów)
- [CI / CD](#ci--cd)
- [Współpraca](#współpraca)

---

## Tryby aplikacji

Postlio działa w dwóch komplementarnych trybach, korzystających z tego samego pipeline'u generowania treści, ale różniących się poziomem automatyzacji.

### Autopilot AI
Harmonogramowana pętla wielu agentów, która zbiera tematy, redaguje posty, generuje materiały graficzne, kolejkuje publikację i wysyła post do odpowiedniego kanału przez Graph / LinkedIn API. Tryb dedykowany dla kont biznesowych, gdzie pełna automatyzacja jest dozwolona i pożądana.

- Wieloagentowe planowanie (research → copywriting → wizualizacja → planowanie)
- Cykliczne joby APScheduler per marka
- Budżety, presety tonu i guard-railsy per platforma
- Pełny audit log każdego wygenerowanego i opublikowanego elementu

### Kreator AI
Interaktywny workspace dla kont prywatnych oraz dla zespołów, które chcą kontrolować każdą publikację. Użytkownik prowadzi agenta krok po kroku, regeneruje materiały na żądanie i sam decyduje o momencie publikacji.

- Edytor "prompt-first" z UX-em iteracyjnym (regenerate-and-iterate)
- Podgląd obok siebie dla formatów Facebook / Instagram / LinkedIn
- Publikacja ręczna przez natywny Share Dialog danej platformy
- Zapis do biblioteki do późniejszego wykorzystania

---

## Stack technologiczny

### Frontend — `postlio_frontend/`
- **Next.js 14.2** (App Router) + **TypeScript 5**
- **Tailwind CSS 3** z autorskim systemem designu **"Liquid Depth"** (dark/light mode, glass-morphism, gradient text, Floating Island Navigation, AI Pulse Indicator)
- **Shadcn/UI** na bazie Radix
- **Zustand** (stan klienta), **TanStack Query 5** (stan serwera)
- **Framer Motion 11** dla animacji i przejść
- **React Hook Form + Zod** dla formularzy i walidacji
- **PWA**: własny Service Worker + Web App Manifest, instalowalna na desktopie i mobile
- Hosting: **Netlify**

### Backend — `postlio_backend/`
- **FastAPI 0.110** na **Pythonie 3.11**, w pełni asynchroniczny
- **PostgreSQL** w **Neon**, **SQLAlchemy 2.0** (async) + **asyncpg**
- **Alembic** do migracji schematu
- **APScheduler** dla cyklicznych jobów Autopilota
- **python-jose** + **passlib/bcrypt** dla auth, szyfrowanie Fernet dla tokenów OAuth zapisanych w bazie
- **httpx** jako jednolity klient HTTP dla AI providerów i social API
- Hosting: **Render**

### AI providers
| Modalność | Domyślny | Alternatywa / fallback |
|-----------|----------|------------------------|
| Tekst | Google **Gemini 2.5 Flash** | **Groq** (Llama 3.3) |
| Obraz | **Pollinations** (Flux, GPT-Image-1 Mini) | **HuggingFace** (Stable Diffusion XL) |
| Wideo | **Pollinations Seedance Lite** (tylko text-to-video) | — |

### Integracje społecznościowe i auth
- **Facebook Graph API v18.0** (strony, publikacja zaplanowana, insighty)
- **Instagram Graph API** (konta business / creator)
- **LinkedIn Marketing API** (strony firmowe, UGC posts)
- **OAuth login**: Facebook, Google

---

## Architektura kont i publikacji

Postlio rozróżnia trzy typy kont. Zakres funkcji wynika z tego, do czego dana platforma dopuszcza zewnętrzne aplikacje.

| Typ konta | Platformy | Autopilot | Auto-publikacja | Uwagi |
|-----------|-----------|-----------|-----------------|-------|
| **Firmowe** | `facebook_page`, `instagram_business`, `instagram_creator`, `linkedin_company` | ✅ | ✅ przez Graph / LinkedIn API | Pełny pipeline, harmonogram, insighty |
| **Prywatne** | `facebook_personal`, `instagram_personal`, `linkedin_personal` | ❌ | ❌ (platformy tego zabraniają) | Tylko Kreator AI; publikacja przez Share Dialog |
| **Demo** | brak | ❌ | ❌ | Generowanie i zapis draftów bez podpinania konta |

Ograniczenia platform są egzekwowane na poziomie API — UI degraduje się płynnie, pokazując użytkownikowi konta prywatnego przycisk "Otwórz Share Dialog" zamiast "Publikuj teraz".

---

## Struktura projektu

```
Postlio/
├── postlio_backend/         Serwis FastAPI (Python 3.11)
│   ├── app/
│   │   ├── api/v1/          Endpointy REST (ai, auth, autopilot, brands, posts, social)
│   │   ├── models/          Modele ORM SQLAlchemy 2.0
│   │   ├── schemas/         Pydantic — request/response
│   │   ├── services/        Logika domenowa (AI manager, publikacja, scheduling)
│   │   ├── workers/         Joby APScheduler
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/             Migracje (8 rewizji)
│   ├── tests/               pytest (unit + integration)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pytest.ini
├── postlio_frontend/        PWA Next.js 14 (TypeScript)
│   ├── src/
│   │   ├── app/             Strony i layouty (App Router)
│   │   ├── components/      Komponenty UI i feature
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/       React Query, motyw, auth
│   │   ├── store/           Slice'y Zustand
│   │   └── types/
│   ├── e2e/                 Testy Playwright
│   ├── public/              Zasoby PWA (manifest, ikony, sw)
│   ├── jest.config.js
│   ├── playwright.config.ts
│   ├── next.config.mjs
│   └── tailwind.config.ts
├── .github/workflows/       Pipeline'y CI (backend.yml, frontend.yml)
├── .gitignore
├── README.md
└── README_PL.md
```

---

## Pierwsze kroki

Backend i frontend to niezależne serwisy, można je uruchamiać w dowolnej kolejności. Na co dzień najwygodniej mieć oba odpalone równolegle.

### Wymagania
- **Node.js 20 LTS** i npm
- **Python 3.11**
- Dostępna baza **PostgreSQL** (wystarczy darmowy tier w Neon)

### Backend

```bash
cd postlio_backend
python -m venv .venv
.venv\Scripts\activate          # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env            # uzupełnij wartościami
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

API będzie dostępne pod `http://localhost:8000`, interaktywne docsy pod `/docs`.

### Frontend

```bash
cd postlio_frontend
npm install
cp .env.local.example .env.local

npm run dev
```

PWA startuje pod `http://localhost:3000` i łączy się z backendem przez `NEXT_PUBLIC_API_URL`.

---

## Zmienne środowiskowe

### Backend (`postlio_backend/.env`)

```env
# Core
DEBUG=false
SECRET_KEY=<32+ losowych znaków>
DATABASE_URL=postgresql+asyncpg://user:pass@host/postlio
FRONTEND_URL=http://localhost:3000

# Szyfrowanie tokenów (klucz Fernet, 32 url-safe base64 bajty)
TOKEN_ENCRYPTION_KEY=

# AI — tekst
GOOGLE_API_KEY=
GROQ_API_KEY=
DEFAULT_TEXT_PROVIDER=gemini

# AI — obraz
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

W CI oraz na hostingach produkcyjnych (Render, Netlify) te same nazwy są dostarczane przez platformowy secret store — patrz [CI / CD](#ci--cd).

---

## Uruchamianie testów

### Backend (`pytest`)

```bash
cd postlio_backend
pytest                          # pełny suite
pytest -m unit                  # tylko unit testy
pytest -m integration           # tylko integracyjne
pytest --cov=app --cov-report=term-missing
```

Markery są zadeklarowane w `pytest.ini`: `unit`, `integration`, `slow`, `external`. CI uruchamia `unit + integration` i pomija `external`.

### Frontend

```bash
cd postlio_frontend

# Jest + React Testing Library
npm run test
npm run test:coverage
npm run test:ci                 # używane w CI (--ci --coverage --maxWorkers=2)

# Playwright E2E
npm run test:e2e
npm run test:e2e:chromium       # pojedyncza przeglądarka, szybciej lokalnie
npm run test:e2e:report         # otwiera ostatni raport HTML
```

Playwright jest skonfigurowany na Chromium, Firefox, WebKit oraz dwa profile mobilne.

---

## CI / CD

Workflow'y leżą w `.github/workflows/` i odpalają się przy każdym pushu i PR-ze dotykającym danej części repo.

| Workflow | Trigger | Etapy |
|----------|---------|-------|
| `backend.yml` | Zmiany w `postlio_backend/**` | Ruff lint → pytest (unit + integration) na Pythonie 3.11 z service-containerem PostgreSQL → upload coverage |
| `frontend.yml` | Zmiany w `postlio_frontend/**` | Type-check → ESLint → Jest (CI) → `next build` → Playwright E2E (Chromium) → upload artefaktów |

Sekrety pobierane są z **GitHub Actions secrets** (`DATABASE_URL`, `SECRET_KEY`, `TOKEN_ENCRYPTION_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `POLLINATIONS_API_KEY`, `HUGGINGFACE_API_KEY`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_API_URL`).

Same deploye obsługują hostingi:
- **Render** auto-deployuje `postlio_backend/` po każdym udanym pushu na `main`
- **Netlify** auto-deployuje `postlio_frontend/` po każdym udanym pushu na `main`

---

## Współpraca

1. Stwórz branch feature'owy z `main`: `git checkout -b feat/<short-slug>`.
2. Trzymaj zmiany w jednym kontekście — PR-y tylko-backend lub tylko-frontend są łatwiejsze do review.
3. Przed pushem odpal odpowiedni suite testów lokalnie.
4. Otwórz PR do `main`; CI musi być zielone, żeby można było scalić.
5. Trzymaj się stylu Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).

Większe zmiany architektoniczne warto najpierw przedyskutować w issue — łatwiej ustalić podejście, zanim padnie pierwsza linia kodu.
