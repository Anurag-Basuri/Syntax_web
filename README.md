# Syntax Club — Full Stack Platform

This document is a single-source, developer-focused README for the Syntax Club repository. It describes the codebase, architecture, key modules (including the Arvantis fest subsystem), development workflow, env variables, APIs, and recommended practices for extending and deploying the application.

Table of contents

- Project summary
- High-level architecture
- Technology stack
- Repository layout (detailed)
  - Client
  - Server
- Arvantis module — design & flow
  - Data model
  - Media handling
  - Controllers & routes
- Frontend structure & key components
- Services & API clients
- Middleware & utilities (server)
- Local development — quickstart
- Environment variables (examples)
- API overview — important endpoints
- Testing, linting & scripts
- Deployment notes & recommendations
- Troubleshooting & tips
- Contributing & code style
- Useful references

---

## Project summary

Syntax Club is a full-stack web application composed of:

- A React + Vite single page application (client/) that renders a public site and an admin dashboard.
- An Express + Node.js backend (server/) using MongoDB (mongoose) exposing a REST API for application data and admin operations.

A major feature set is the "Arvantis" module: a festival/editions manager with events, partners, media (hero/posters/gallery), guidelines, prizes, tracks, guests, analytics and reporting.

---

## High-level architecture

- Client (SPA) ↔ Server (REST API)
- Server stores persistent data in MongoDB and stores media via Cloudinary (or other configured provider).
- Authentication uses JWT tokens and role checks in middleware.
- File uploads use multer on the server; media utilities handle Cloudinary upload/delete and canonicalize media objects returned to clients.
- Frontend organizes domain API calls in services/\*.js; components call services and show UI.

---

## Technology stack

Frontend

- React, JSX, functional components
- Vite (dev server & build)
- TailwindCSS for styling
- React Query (recommended where used)
- Framer Motion (animations)
- Icons via Lucide or similar
- Modern tooling: ESLint, Prettier

Backend

- Node.js + Express
- MongoDB + Mongoose
- Multer for multipart/form-data (uploads)
- Cloudinary util for media storage
- Validation middleware + custom ApiError / ApiResponse helpers
- Utilities: asyncHandler, arvantisMedia normalization helpers

Dev tooling

- nodemon for dev server reloads
- PM2 / Docker recommended for production

---

## Repository layout (important files & folders)

Top-level:

- client/ — frontend SPA
- server/ — backend API
- README.md — this file

Client (d:\projects\Syntax_Club\client)

- package.json, vite.config.js, tailwind.config.js
- src/main.jsx — app entry
- src/index.css, arvantis.css, design.css — styling
- src/services/\*.js — centralized API clients (api.js) and domain services (arvantisServices.js, eventServices.js, etc.)
- src/components/ — UI components, grouped (Arvantis, admin, event, member, etc.)
  - Arvantis components: GlassCard.jsx, ImageLightbox.jsx, MediaSection.jsx, PosterHero.jsx, FestList.jsx, FestHeader.jsx, EditGuidelines.jsx, EditPrizes.jsx, EditGuests.jsx, etc.
- src/pages/ — route-level pages (arvantis/, adminDash.jsx, home.jsx, etc.)
- src/utils/ — small helpers (formatApiError.js, fileUtils.js, handleTokens.js)

Server (d:\projects\Syntax_Club\server)

- package.json, src/app.js, src/server.js
- src/controllers/ — domain controllers: arvantis.controller.js, event.controller.js, member.controller.js, ticket.controller.js, etc.
- src/models/ — mongoose models: arvantis.model.js, event.model.js, member.model.js, ticket.model.js, ...
- src/routes/ — express routers (arvantis.routes.js, event.routes.js, member.routes.js, ...)
- src/middlewares/ — auth.middleware.js, multer.middleware.js, validator.middleware.js, normalizeEvent.middleware.js, rateLimit.middleware.js
- src/utils/ — ApiError.js, ApiResponse.js, cloudinary.js, arvantisMedia.js, asyncHandler.js, error.js, format helpers
- src/services/ — service-layer helpers (qrcode.service.js, email.service.js, payment integrations)

---

## Arvantis module — design & flow

Purpose: manage festival editions ("fests") and related data such as events, partners, media, tracks, FAQs, guidelines, prizes, guests, analytics and reports.

Key concepts:

- A Fest (Arvantis document) contains metadata (name, year, slug, dates, location, contact), arrays for partners, posters, gallery, tracks, faqs, guidelines, prizes, guests and references to events.
- Media model: media items are normalized via server utils (arvantisMedia.js) to include keys such as publicId, url, secureUrl, mimeType, width, height and optional caption.
- Media upload endpoints accept multipart FormData; server multer middleware stores file buffer to Cloudinary (or disk in dev) and returns normalized objects.

Data model (high level)

- server/src/models/arvantis.model.js — Arvantis schema with fields:
  - name, year, slug, tagline, description, startDate, endDate, location, status, socialLinks, themeColors
  - arrays: partners, posters, gallery, tracks, faqs, guidelines, prizes, guests
  - analytics and report metadata (generated)

Media handling

- Upload flow: client sends FormData -> server multer middleware -> cloudinary util -> arvantisMedia.normalize -> returns media object -> controller pushes to fest doc -> response returns updated media object(s).
- Deletion: controller deletes Cloudinary publicId + removes object from DB arrays; bulk-delete endpoint exists.

Controllers & routes

- server/src/controllers/arvantis.controller.js — implements CRUD for fests and sub-resources (partners, media, guidelines, prizes, guests, tracks, faqs), analytics + export endpoints, duplicatefest, status toggles and reporting.
- server/src/routes/arvantis.routes.js — wires public and admin endpoints, uses middlewares (protect, authorize) for admin-only routes.
- client/src/services/arvantisServices.js — mirrors routes via functions: getArvantisLandingData, getAllFests, getFestDetails, createFest, updateFestDetails, addGalleryMedia, addFestPoster, updateFestHero, bulkDeleteMedia, addGuideline, updatePrize, addGuest, reorder endpoints, export & analytics downloads, etc.

---

## Frontend structure & key components

- Main app entry: src/main.jsx wiring router, contexts (Auth, Theme) and app-shell.
- Arvantis pages:
  - pages/arvantis/arvantis.jsx — public landing page composition (hero, editions, events grid, gallery).
  - pages/arvantis/editArvantis.jsx — admin editor for fests (complete editing UI, uses all services).
- Components:
  - PosterHero.jsx — hero + poster rendering + CTA
  - EventsGrid.jsx — lists events with lazy-load details
  - ImageLightbox.jsx — fullscreen image viewer (recommendation: mount in a portal; README includes fix hint)
  - MediaSection.jsx — admin UI for hero/posters/gallery upload & delete
  - FestList.jsx & FestHeader.jsx — admin list and header controls
  - EditGuidelines.jsx, EditPrizes.jsx, EditGuests.jsx — small CRUD editors for sub-resources
- Services:
  - src/services/api.js — axios clients (apiClient with auth, publicClient)
  - arvantisServices.js — all Arvantis-related API wrappers and helpers including normalizePagination and error extraction
  - eventServices.js, memberServices.js, authServices.js — domain services for other flows

---

## Middleware & utilities (server)

Key middlewares:

- auth.middleware.js — protects admin routes and provides authorize(role) checks
- multer.middleware.js — handles multipart uploads and file size/type validation
- validator.middleware.js — express-validator wrappers for route validation
- normalizeEvent.middleware.js — normalizes incoming event payloads to expected shape
- rateLimit.middleware.js — apply request throttling for public API

Utilities:

- cloudinary.js — Cloudinary client wrappers (upload, delete)
- arvantisMedia.js — normalizes media objects (consistent publicId, url, mime, dimensions)
- ApiError.js / ApiResponse.js — consistent response envelope and error-handling
- asyncHandler.js — wraps async controllers to forward errors to error handler

---

## Local development — quickstart

Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB (local or Atlas)
- Cloudinary account for media (recommended) or a local uploads fallback

Install

```bash
# server
cd server
npm install

# client
cd client
npm install
```

Run in development (two terminals)

```bash
# start server (nodemon recommended)
cd server
npm run dev

# start client (vite)
cd client
npm run dev
```

Build & run production

```bash
# client build
cd client
npm run build

# server start (ensure production env vars)
cd server
npm run start
```

Useful scripts (check package.json in each folder):

- client: dev, build, preview, lint, format
- server: dev (nodemon), start, migrate (if present), seed (if present)

---

## Environment variables (examples)

Server (.env)

- NODE_ENV=development
- PORT=5000
- MONGO_URI=mongodb://localhost:27017/syntax_club
- JWT_SECRET=your_jwt_secret
- JWT_EXPIRES_IN=7d
- CLOUDINARY_CLOUD_NAME=...
- CLOUDINARY_API_KEY=...
- CLOUDINARY_API_SECRET=...
- EMAIL*PROVIDER*\* (if email.service configured)
- CASHFREE/INSTAMOJO keys (if payments used)

Client (.env)

- VITE_API_BASE=http://localhost:5000/api/v1
- VITE_SENTRY_DSN=... (optional)
- VITE_OTHER_KEYS=...

Notes:

- Keep secrets out of repo. Use a .env.local for local overrides (gitignored).

---

## API overview — important endpoints

Base path: /api/v1 (confirm api.js in client for exact base)

Arvantis (public)

- GET /api/v1/arvantis/landing — latest public landing data
- GET /api/v1/arvantis — list fests (paginated)
- GET /api/v1/arvantis/:identifier — fest details (slug / year / id)

Arvantis (admin — protected)

- POST /api/v1/arvantis — create fest
- PATCH /api/v1/arvantis/:identifier/update — update details
- DELETE /api/v1/arvantis/:identifier — delete fest
- PATCH /api/v1/arvantis/:identifier/posters — upload posters (FormData)
- PATCH /api/v1/arvantis/:identifier/hero — upload hero (FormData)
- POST /api/v1/arvantis/:identifier/gallery — add gallery media
- DELETE /api/v1/arvantis/:identifier/gallery/:publicId — remove gallery item
- POST /api/v1/arvantis/:identifier/guidelines — add guideline
- PATCH /api/v1/arvantis/:identifier/guidelines/:guidelineId — update guideline
- DELETE /api/v1/arvantis/:identifier/guidelines/:guidelineId — delete guideline
- Similar routes exist for prizes, guests, partners, tracks, faqs, reordering, bulk-media-delete, analytics and report export

Other domains: events, members, tickets — see server/src/routes/\* for complete list.

---

## Testing, linting & code quality

- Lint: run ESLint in client and server (scripts defined in package.json)
- Format: Prettier config included
- Unit & integration tests: add tests under client/**tests** and server/tests (not included by default)
- Recommended: add GitHub Actions to run lint & tests on PRs, and run build for production before merge.

---

## Deployment notes & recommendations

- Frontend: build with Vite and deploy static files to CDN or static host (Vercel, Netlify, S3+CloudFront).
- Backend: serve with Node/PM2, inside Docker container, or on a node host. Ensure env vars set and DB accessible.
- Use a CDN and caching for images — Cloudinary or S3 + CloudFront recommended.
- Use TLS/HTTPS, enable HTTP security headers, and rate limit public endpoints.

Suggested production checklist:

- Enable CORS only for required origins
- Set secure cookie flags
- Ensure large file uploads are blocked or buffered to cloud storage
- Configure logging/monitoring (Sentry/LogDNA)
- Backup MongoDB or use managed Atlas with snapshots

---

## Troubleshooting & tips

- Image lightbox scrolling: ensure Lightbox mounts in a portal and sets document.body.style.overflow = 'hidden' while open.
- 401/403 errors: ensure auth token present in apiClient (client/src/services/api.js) and the server's JWT_SECRET matches the token issuer.
- Upload failures: verify Cloudinary credentials and check multer limits in multer.middleware.js.
- Mongoose validation errors: controllers return standardized error messages via ApiError — inspect server logs for stack traces.

---

## Extending the Arvantis editor (practical tips)

- Frontend: add small focused components for sub-resources (GuidelineEditor, PrizeEditor, PartnerEditor) and reuse services in src/services/arvantisServices.js.
- Batch operations: prefer server-side batch endpoints (bulk media delete already present) to keep client logic simple.
- Caching: use React Query for admin lists and details; invalidate queries after mutations.
- Accessibility: provide labels, keyboard navigation and alt text for all images.

---

## Contributing & code style

- Follow existing folder conventions (components grouped by domain).
- Add a unit test for any new controller or frontend component that contains business logic.
- Open a PR with descriptive title + link to issue. CI should pass lint & tests before merge.
- Keep commits small and atomic; use conventional commit messages if desired.

---

## Useful references (quick links inside repo)

- Client entry & config: client/src/main.jsx, client/vite.config.js, client/tailwind.config.js
- Arvantis UI: client/src/pages/arvantis, client/src/components/Arvantis
- Arvantis server: server/src/controllers/arvantis.controller.js, server/src/routes/arvantis.routes.js, server/src/models/arvantis.model.js
- Media util: server/src/utils/arvantisMedia.js and server/src/utils/cloudinary.js
- API helpers: client/src/services/arvantisServices.js and client/src/services/api.js

---

If you want, I can:

- Patch ImageLightbox.jsx to use a React portal and fix scroll/position problems.
- Generate a Dockerfile and docker-compose.yml for local multi-service development (client + server + mongo).
- Create sample .env.example files for client and server with exact keys.
