# Syntax Club — Full Stack Platform (Improved README)

This README documents the full Syntax_Club repository (client + server). It is developer-focused and designed to help new contributors and maintainers quickly understand architecture, data flows, code structure, setup, and extension points. It also includes practical engineering notes (security, performance, testing, deployment).

Table of contents

- Project summary
- High-level architecture & runtime flow
- Technology stack (detailed)
- Repository layout (explain what each folder does)
- Key modules and important files (what to read first)
- Data models and Arvantis domain model (fields, sub-resources)
- Media handling & upload flow (Cloudinary + multer)
- Frontend architecture & component map
- Services / API clients (how frontend talks to backend)
- Middleware, utilities & server helpers
- Local development — quickstart & useful scripts
- Environment variables — full examples
- API reference (most-used endpoints)
- Testing, linting & CI recommendations
- Production & deployment checklist
- Troubleshooting & common gotchas
- How to extend Arvantis editor (practical recipe)
- Contribution guidelines & code style
- Appendix: useful CLI commands & tips

---

## Project summary

- Syntax Club is a full-stack application for club management and events, with a prominent feature: the Arvantis festival subsystem.
- It contains a React + Vite frontend (client/) and an Express + Node.js + MongoDB backend (server/).
- The Arvantis module supports multi-edition fests, events, partners, media (hero/posters/gallery), tracks, FAQs, guidelines, prizes, guests, analytics and exports.

---

## High-level architecture & runtime flow

1. Frontend (SPA) renders public pages and an admin dashboard. It calls REST endpoints on the server.
2. Server exposes REST API (versioned under /api/v1) and performs business logic, persisting data in MongoDB via Mongoose.
3. Media files uploaded by admins are accepted as multipart/form-data and handled by multer; production systems upload to Cloudinary (server/src/utils/cloudinary.js) and return normalized media objects (server/src/utils/arvantisMedia.js).
4. Authentication uses JWT (server middleware) for protected routes; admin UI calls admin endpoints via auth-equipped axios client.

---

## Technology stack

Frontend

- React (functional components, hooks)
- Vite (fast dev server, HMR)
- TailwindCSS for utility-first styling + a few custom CSS files
- Axios for HTTP (client/src/services/api.js)
- Optional: React Query for caching (project can adopt more use)
- Framer Motion (animations)
- ESLint, Prettier for code style

Backend

- Node.js (>=18 recommended) + Express
- MongoDB with Mongoose schemas
- Multer (uploads) + Cloudinary utility for remote storage
- Middleware: auth, validation, rate limiting, CORS, normalizeEvent
- Utilities: ApiError/ApiResponse, asyncHandler wrapper, arvantisMedia normalizer

Dev / infra

- nodemon for server dev
- Docker (suggested) for reproducible deployment
- PM2 or container orchestration recommended for production

---

## Repository layout (what each top-level folder contains)

Root

- README.md (this file)
- .env (dev-only)
- package.json (root-level tasks, if any)

client/ (frontend)

- index.html, vite.config.js, tailwind.config.js
- src/main.jsx — app bootstrap (router, contexts)
- src/pages/ — page-level components (home, adminDash, arvantis)
- src/components/ — reusable UI components, grouped by domain: Arvantis, admin, event, member, etc.
- src/services/ — HTTP clients & domain API wrapper functions (arvantisServices.js, eventServices.js, authServices.js)
- src/utils/ — small helpers (fileUtils, formatApiError, handleTokens)
- src/styles/ and global CSS files (index.css, arvantis.css, design.css)
- assets/ for static images and icons

server/ (backend)

- src/app.js — express app wiring (middlewares, routes)
- src/server.js — server listen/bootstrap
- src/controllers/ — controllers per domain: arvantis.controller.js, event.controller.js, ticket.controller.js etc.
- src/models/ — Mongoose schemas (arvantis.model.js, event.model.js, member.model.js, ticket.model.js)
- src/routes/ — route definitions and route-level validation
- src/middlewares/ — auth.middleware.js, multer.middleware.js, validator.middleware.js, normalizeEvent.middleware.js, rateLimit.middleware.js
- src/utils/ — cloudinary.js, arvantisMedia.js, ApiError.js, ApiResponse.js, asyncHandler.js, error.js
- src/services/ — service helpers: qrcode, email, payment integrations
- uploads/ — local storage fallback (dev)

---

## Key modules & recommended files to read first

Frontend

1. client/src/services/api.js — axios clients, auth token injection
2. client/src/services/arvantisServices.js — the canonical set of API wrappers used by Arvantis pages/components
3. client/src/pages/arvantis/editArvantis.jsx — admin editor (comprehensive usage of services)
4. client/src/components/Arvantis/\* — MediaSection.jsx, FestHeader.jsx, FestList.jsx, ImageLightbox.jsx, EditGuidelines.jsx, EditPrizes.jsx, EditGuests.jsx

Backend

1. server/src/models/arvantis.model.js — domain model for Arvantis (fields & subdocuments)
2. server/src/controllers/arvantis.controller.js — controller actions: list, details, create, update, media upload, sub-resource CRUD
3. server/src/routes/arvantis.routes.js — API surface and middleware wiring
4. server/src/utils/arvantisMedia.js & cloudinary.js — how uploaded files are normalized and stored

---

## Arvantis data model (conceptual, high-level)

- Fest (Arvantis document) fields:
  - core: \_id, name, slug, year, tagline, description, startDate, endDate, location, status, visibility
  - contact: contactEmail, contactPhone, socialLinks (object)
  - theme: themeColors (object), presentation (rich markdown/blocks)
  - media: heroMedia (object), posters (array of media), gallery (array of media)
  - arrays: partners, tracks, faqs, guidelines, prizes, guests
  - analytics/reporting: analytics metadata, usage stats, exported reports
- Subdocuments (media item): { publicId, url, secureUrl, mimeType, width, height, caption, providerMeta }

---

## Media handling & upload flow (important)

1. Client builds FormData objects (file(s) + optional metadata).
2. Server multer.middleware receives file(s) and (in production) streams them to Cloudinary via server/src/utils/cloudinary.js.
3. cloudinary util returns provider metadata; arvantisMedia.normalize transforms provider response to canonical media object.
4. Controller stores the canonical media object in the fest document and returns it to client.
5. Deletion endpoints remove provider resource (cloudinary.delete) and update DB arrays. Bulk delete endpoint exists for batch ops.

Best practices:

- Keep images transcoded & sized via Cloudinary transformations (use cached CDN URLs).
- For large files use direct-to-cloud uploads (signed upload) in future iteration to offload server RAM.
- Normalize and version media objects in DB so frontends can render deterministic shapes.

---

## Frontend architecture & component map (how UI pieces connect)

- Pages: the top-level pages (home, arvantis landing, editArvantis admin) compose smaller components.
- Arvantis components:
  - PosterHero — hero area with CTA and poster thumbnails
  - EventsGrid — event tiles; fetch event details lazily
  - GalleryGrid + ImageLightbox — gallery thumbnails with fullscreen viewer (use portal)
  - Admin: editArvantis.jsx orchestrates:
    - FestList (left panel: pick edition)
    - FestHeader (save, delete, status, duplicate)
    - BasicDetails (edit metadata)
    - MediaSection (hero, posters, gallery)
    - EditGuidelines, EditPrizes, EditGuests (sub-resource editors)
- Data flow:
  - UI triggers actions -> call functions from client/src/services/arvantisServices.js -> update local state and/or refetch -> show toast/error via centralized helper.

Important UI notes

- ImageLightbox should be mounted using React Portal to avoid stacking context and scrolling issues.
- Use loading states for long operations and optimistic UI updates only when rollback is possible.

---

## Services / API clients (what to use & where)

- client/src/services/api.js exports:
  - apiClient: axios instance for authenticated admin operations (includes auth token)
  - publicClient: axios instance for public endpoints (no token)
- client/src/services/arvantisServices.js provides high-level functions that mirror server routes and include:
  - normalizePagination, extractError helpers
  - getArvantisLandingData, getAllFests, getFestDetails
  - admin functions: createFest, updateFestDetails, deleteFest, duplicateFest, setFestStatus, updatePresentation, updateSocialLinks, updateThemeColors
  - media: addFestPoster, removeFestPoster, updateFestHero, addGalleryMedia, removeGalleryMedia, bulkDeleteMedia
  - sub-resources: addPartner/updatePartner/removePartner/reorderPartners, addTrack/updateTrack/removeTrack/reorderTracks, addFAQ/updateFAQ/removeFAQ/reorderFAQs, addGuideline/updateGuideline/removeGuideline/reorderGuidelines, addPrize/updatePrize/removePrize/reorderPrizes, addGuest/updateGuest/removeGuest
  - exports/analytics: exportFestsCSV, getFestAnalytics/getFestStatistics, generateFestReport & download helpers

Guideline:

- Reuse service functions directly in components/pages; keep API logic in services, UI-only logic in components.

---

## Server middleware & utilities (what they do)

- auth.middleware.js — validates JWT and attaches user to request, plus role-based guard.
- multer.middleware.js — file size/type validation; provides single/multiple handlers for route usage.
- validator.middleware.js — express-validator wrappers that standardize error responses.
- normalizeEvent.middleware.js — converts event payload shapes into canonical format before persistence.
- rateLimit.middleware.js — basic per-IP throttling for public endpoints.
- utils/ApiError.js & ApiResponse.js — consistent envelope for success / error responses.
- asyncHandler.js — catch async exceptions and forward to central error handler.

---

## Local development — quickstart & useful scripts

Prereqs

- Node.js 18+ (LTS)
- MongoDB (local or Atlas)
- Recommended: Cloudinary account (for media); otherwise the server falls back to local uploads folder.

Clone & install

```bash
git clone <repo-url> d:\projects\Syntax_Club
cd d:\projects\Syntax_Club\server
npm install
cd ../client
npm install
```

Run in dev (two terminals)

```bash
# Terminal 1: server
cd d:\projects\Syntax_Club\server
npm run dev         # nodemon or equivalent

# Terminal 2: client
cd d:\projects\Syntax_Club\client
npm run dev         # vite dev
```

Build & preview

```bash
# frontend build
cd d:\projects\Syntax_Club\client
npm run build
npm run preview     # serve production bundle locally

# server production
cd d:\projects\Syntax_Club\server
NODE_ENV=production npm start
```

Helpful npm scripts (check package.json in each folder)

- client: dev, build, preview, lint, format
- server: dev, start, seed (if present)

---

## Environment variables (complete examples)

server/.env (example)

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syntax_club
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_FROM=hello@syntaxclub.example
SMTP_HOST=smtp.example
SMTP_PORT=587
SMTP_USER=smtp_user
SMTP_PASS=smtp_pass
```

client/.env (example)

```
VITE_API_BASE=http://localhost:5000/api/v1
VITE_SENTRY_DSN=       # optional
VITE_SOME_FEATURE_FLAG=true
```

Security note: Never commit real secrets. Provide `.env.example` and add `.env` to .gitignore.

---

## API reference (essential endpoints — quick lookup)

Base: {VITE_API_BASE} (client uses /api/v1 by default)

Public

- GET /arvantis/landing
- GET /arvantis?page=&limit=&q=
- GET /arvantis/:identifier

Admin (requires auth)

- POST /arvantis
- PATCH /arvantis/:identifier/update
- DELETE /arvantis/:identifier
- PATCH /arvantis/:identifier/posters (FormData: posters[])
- PATCH /arvantis/:identifier/hero (FormData: hero, caption)
- POST /arvantis/:identifier/gallery (FormData: media[])
- DELETE /arvantis/:identifier/gallery/:publicId
- POST /arvantis/:identifier/media/bulk-delete (body: { publicIds: [] })
- Partners, tracks, faqs, guidelines, prizes, guests: CRUD + reorder endpoints (see server/src/routes/arvantis.routes.js)
- GET /arvantis/export/csv (returns CSV blob)
- GET /arvantis/analytics/overview
- GET /arvantis/statistics/overview
- GET /arvantis/reports/:identifier

For complete route list inspect `server/src/routes/*.js`.

---

## Testing, linting & CI recommendations

- Add unit tests for controllers and services (Jest or Mocha + Supertest for API).
- Add frontend tests for components (React Testing Library).
- CI pipeline should run: lint -> unit tests -> build.
- Add pre-commit hooks (husky) to run lint and simple tests locally.

---

## Production & deployment checklist

- Use environment-specific Cloudinary credentials.
- Ensure CORS origins are restricted to your frontend host(s).
- Use HTTPS and secure cookie flags for any auth cookies.
- Move file uploads to direct-to-cloud signed uploads if handling large files.
- Use process manager (PM2) or Docker; consider containerizing both client (static) and server.
- Add monitoring: logs (structured JSON), performance tracing (APM), error reporting (Sentry).
- Backup MongoDB regularly (Atlas snapshots or backup pipelines).

Suggested Docker snippet (high-level)

- Build client static files during CI, serve via nginx.
- Run server in a Node container, connected to production MongoDB.
- Use docker-compose with a named network and volumes for logs/backups.

---

## Troubleshooting & common gotchas

- 401/403: validate token issuance and that apiClient attaches Authorization header (client/src/services/api.js).
- Upload fails: check multer limits in server/src/middlewares/multer.middleware.js and Cloudinary credentials.
- Lightbox scrolling: mount ImageLightbox via a React portal; set document.body.style.overflow = 'hidden' while open.
- Mongoose validation errors: controller error handler returns ApiError with details — inspect server logs & response payload.

---

## How to extend Arvantis editor (practical recipe)

1. Add new server route + controller function (e.g., `/arvantis/:id/new-feature`).
2. Implement validation middleware and unit tests for controller.
3. Add service wrapper function in `client/src/services/arvantisServices.js`.
4. Create small focused UI component (components/Arvantis/NewFeatureEditor.jsx) — keep it presentational and call service functions.
5. Add component to `client/src/pages/arvantis/editArvantis.jsx` and wire UX states (loading, errors, success).
6. Use optimistic update only if safe; otherwise fetch the updated fest document after mutation (getFestDetails).

---

## Contribution guidelines & code style

- Use existing ESLint/Prettier configs. Run lint and format before pushing.
- Keep commits atomic and descriptive. Use PRs with clear descriptions and testing notes.
- Document new API endpoints in this README and add integration tests.
- Review DB migrations when changing Mongoose schemas.

---

## Appendix: useful commands & tips

Server

- dev: cd server && npm run dev
- start prod: NODE_ENV=production npm start
- seed (if provided): npm run seed

Client

- dev: cd client && npm run dev
- build: cd client && npm run build
- preview: npm run preview

Database

- Start local mongo: `mongod --dbpath <path>` or use Docker: `docker run -d -p 27017:27017 --name mongo mongo:6`
