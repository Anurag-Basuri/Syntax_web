# Syntax Club — Full Stack Platform (Complete Documentation)

This README is a single-source, developer-focused documentation for the Syntax_Club repository (frontend + backend). It describes architecture, features, file structure, key files, environment variables, development workflow, build & deployment advice, API reference, debugging tips, and recommended improvements. Use this as the canonical guide for maintaining and extending the project.

Table of contents

- Project overview
- Features & capabilities
- High-level architecture & runtime flow
- Technology stack
- Repository structure (detailed)
  - Root
  - client (frontend)
  - server (backend)
- Core data models and media pipeline
- API reference (essential endpoints)
- Local development (Windows commands)
- Environment variables (complete list & examples)
- Building & deploying (recommendations + Docker)
- Testing, linting & CI
- Troubleshooting & debugging
- Security considerations
- Contributing, code style & PR checklist
- Recommended improvements / roadmap
- Appendix: useful file references

---

Project overview

Syntax Club is a full-stack web application for club management and an annual technical festival (Arvantis). The repository contains:

- A React-based single page application (client/) for public site and admin dashboard.
- An Express + Node.js API (server/) powered by MongoDB (Mongoose). The server supports admin-only operations, file uploads, analytics and exports.

This README documents both sides so contributors can quickly understand design decisions and extension points.

---

Features & capabilities (what the system does)

- Public site:
  - Arvantis landing page (latest edition, hero, events, gallery).
  - Event previews and event detail pages.
  - Club information, team, testimonials, contact forms.
- Admin dashboard:
  - Create / edit / delete festival editions (Arvantis).
  - Manage events, partners, tracks, FAQs, guidelines, prizes, guests.
  - Upload and manage media: hero, posters, gallery; bulk delete media.
  - Export festival data (CSV), download reports & analytics.
  - Ticket management and generation (ticket controller + QR).
- Media pipeline:
  - Multer-based file intake, Cloudinary upload helper, normalized media objects stored in DB.
- Integrations:
  - Payment (Cashfree / Instamojo services present)
  - Email service
  - QR generator
- Middlewares & utilities:
  - JWT-based auth, validation middleware, rate-limiting, error handlers, ApiError/ApiResponse helpers.

---

High-level architecture & runtime flow

1. Browser (React SPA) calls REST endpoints at server/api.
2. Server controllers perform business logic, persist to MongoDB, call external services (Cloudinary, payment providers, email).
3. File uploads are accepted as multipart form-data; multer handles file buffers and the Cloudinary utility uploads them; server normalizes provider responses into canonical media objects (publicId, url, mimeType, width, height, caption).
4. Client services (arvantisServices.js, eventServices.js, etc.) encapsulate all API calls and provide concise functions for components.

---

Technology stack

Frontend

- React 18 (Vite)
- Tailwind CSS + scoped CSS files (arvantis.css, design.css, index.css)
- Axios (client/src/services/api.js) for HTTP
- Framer Motion (animations)
- React.lazy + Suspense for heavy UI (ImageLightbox)
- ESLint + Prettier

Backend

- Node.js (>= 18), Express
- MongoDB (Mongoose)
- Multer for uploads; Cloudinary wrapper (server/src/utils/cloudinary.js)
- Utilities: asyncHandler, ApiError, ApiResponse
- Nodemon for dev (server dev script)

Dev tools & infra

- Git, npm
- Docker recommended for production
- Optional: Sentry for error tracking

---

Repository layout (detailed)

Root

- README.md (this file)
- VPS_DEPLOYMENT_GUIDE.md (if present)
- .prettierrc, .gitignore

client/ (frontend — d:\projects\Syntax_Club\client)

- index.html, package.json, vite.config.js, tailwind.config.js
- src/
  - main.jsx — app bootstrap (router, context providers)
  - App.jsx — top-level app
  - css: index.css, arvantis.css, design.css, App.css
  - assets/ — static images & icons
  - components/
    - top-level UI (Hero, Navbar, Footer, etc.)
    - admin/ — Admin dashboard components (DashboardTab.jsx, EventsTab.jsx, TicketsTab.jsx, etc.)
    - Arvantis/ — festival UI
      - Badge.jsx, BasicDetails.jsx, Countdown.jsx
      - EditGuests.jsx, EditGuidelines.jsx, EditPrizes.jsx
      - EditionsStrip.jsx, EmptyState.jsx, ErrorBlock.jsx
      - EventsGrid.jsx, FestDetails.jsx, FestHeader.jsx, FestList.jsx, FestUtilities.jsx
      - GalleryGrid.jsx, GlassCard.jsx, ImageLightbox.jsx, LoadingBlock.jsx, LoadingSpinner.jsx, MediaSection.jsx, PartnerQuickAdd.jsx, PosterHero.jsx
    - event/, member/, team/, upcoming_events/ — domain components
  - pages/
    - adminDash.jsx, home.jsx, contact.jsx, arvantis/ (landing and edit pages)
  - services/
    - api.js — axios client(s) with auth handling
    - arvantisServices.js — all festival API wrappers (getAllFests, getFestDetails, addGalleryMedia, addGuideline, addPrize, addGuest, bulkDeleteMedia, exportFestsCSV, etc.)
    - eventServices.js, authServices.js, ticketServices.js, applyServices.js, contactServices.js, memberServices.js, socialsServices.js
  - utils/ — fileUtils.js, formatApiError.js, handleTokens.js, paymentHandler.js
  - hooks/ — useAuth, useEvents, useMembers, etc.
  - context/ — AuthContext.jsx, ThemeContext.jsx
  - constants/ — team.js

server/ (backend — d:\projects\Syntax_Club\server)

- package.json, src/, .env (example)
- src/
  - server.js — process bootstrap
  - app.js — express app wiring (middlewares, routes)
  - database/index.js — MongoDB connection
  - routes/
    - admin.routes.js, apply.routes.js, arvantis.routes.js, contact.routes.js, event.routes.js, member.routes.js, socials.routes.js, ticket.routes.js
  - controllers/
    - admin.controller.js, apply.controller.js, arvantis.controller.js, cashFree.controller.js, contact.controller.js, coupon.controller.js, event.controller.js, instamojo.controller.js, member.controller.js, socials.controller.js, ticket.controller.js
  - models/
    - admin.model.js, apply.model.js, arvantis.model.js, contact.model.js, coupon.model.js, event.model.js, member.model.js, socials.model.js, ticket.model.js, Transaction.js
  - middlewares/
    - auth.middleware.js — JWT auth and role checks
    - cors.middleware.js
    - multer.middleware.js — file upload helpers and validation
    - normalizeEvent.middleware.js
    - rateLimit.middleware.js
    - validator.middleware.js
  - services/
    - cashFree.service.js, email.service.js, instamojo.service.js, qrcode.service.js
  - utils/
    - cloudinary.js — Cloudinary wrapper (upload/delete)
    - arvantisMedia.js — normalization of provider responses into canonical media objects
    - ApiError.js, ApiResponse.js — consistent response envelopes
    - asyncHandler.js — catch async errors
    - error.js — centralized error handler
    - generateAndSendTicket.js

---

Core data models & media pipeline

Important models

- server/src/models/arvantis.model.js — Fest model: core fields (name, tagline, description, slug, year, dates), media (heroMedia, posters, gallery), arrays for partners, tracks, faqs, guidelines, prizes, guests, analytics metadata.
- server/src/models/event.model.js — Event model: title, description, dates, location, mediaSchema for validating media items (url, publicId, mime, width/height).

Media pipeline (upload flow)

1. Client forms FormData (files + metadata) and calls admin endpoint through arvantisServices.js.
2. server/src/middlewares/multer.middleware.js receives files.
3. server/src/utils/cloudinary.js uploads files to Cloudinary and returns provider metadata.
4. server/src/utils/arvantisMedia.js normalizes Cloudinary response into canonical media object:
   - publicId, url, secureUrl, mimeType, resourceType, width, height, caption (optional), providerMeta
5. Controller (arvantis.controller.js) inserts media object(s) into corresponding arrays on the fest (posters/gallery/hero) and persists.

Bulk media delete

- bulk-delete endpoint exists to delete many media items by publicId; controller removes from DB arrays and deletes from Cloudinary.

---

API reference (essential endpoints)

Base path: /api/v1 (confirm in server/app.js or client service base)

Arvantis (public)

- GET /api/v1/arvantis/landing — fetch latest landing payload
- GET /api/v1/arvantis — list fests (pagination)
- GET /api/v1/arvantis/:identifier — details for a fest (slug, id or year)

Arvantis (admin — protected)

- POST /api/v1/arvantis — create new fest
- PATCH /api/v1/arvantis/:identifier/update — update metadata
- DELETE /api/v1/arvantis/:identifier — delete fest
- PATCH /api/v1/arvantis/:identifier/posters — upload posters (FormData: posters[])
- PATCH /api/v1/arvantis/:identifier/hero — upload hero (FormData: hero, caption)
- POST /api/v1/arvantis/:identifier/gallery — add gallery media (FormData: media[])
- DELETE /api/v1/arvantis/:identifier/gallery/:publicId — remove gallery item
- POST /api/v1/arvantis/:identifier/media/bulk-delete — body { publicIds: [] }
- POST/PATCH/DELETE — guidelines, prizes, guests, partners, tracks endpoints for CRUD + reorder
- GET /api/v1/arvantis/export/csv — export fests CSV
- GET /api/v1/arvantis/analytics/overview — analytics

Other domains (examples)

- Events: server/src/routes/event.routes.js → create, update, get, list events
- Tickets: server/src/routes/ticket.routes.js → ticket generation & lookup
- Members, socials, contact, apply, coupon → controllers & routes present in server/src/controllers & server/src/routes

Note: Check server/src/routes/\*.js for complete route definitions, middleware usage and validation.

---

Local development (Windows-oriented quickstart)

Prerequisites

- Node.js 18+
- npm
- MongoDB (local or Atlas)
- Optional: Cloudinary account for uploads

Clone & install
Open PowerShell or Command Prompt.

```powershell
# Clone (if not already)
git clone <repo-url> d:\projects\Syntax_Club
cd d:\projects\Syntax_Club

# Install server deps
cd server
npm install

# Install client deps (new terminal)
cd ..\client
npm install
```

Run dev servers (two terminals)

```powershell
# Terminal 1: start server (dev)
cd d:\projects\Syntax_Club\server
npm run dev    # typically runs nodemon or node with env

# Terminal 2: start client (Vite)
cd d:\projects\Syntax_Club\client
npm run dev
```

Open browser:

- Client dev: http://localhost:5173 (Vite default) or as printed by Vite
- Server API: http://localhost:5000 (or port set in server/.env)

Build & run production locally

```powershell
# Build client
cd d:\projects\Syntax_Club\client
npm run build
npm run preview  # serve the production build locally via Vite preview

# Start server (production)
cd d:\projects\Syntax_Club\server
NODE_ENV=production npm start
```

Check package.json scripts in both client/ and server/ to confirm exact script names.

---

Environment variables (complete lists & examples)

server/.env (example - DO NOT COMMIT)

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syntax_club
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP (for email.service)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=smtp_user
SMTP_PASS=smtp_pass
EMAIL_FROM=hello@syntaxclub.example

# Payment provider credentials (if used)
CASHFREE_KEY=...
CASHFREE_SECRET=...
INSTAMOJO_KEY=...
INSTAMOJO_SECRET=...
```

client/.env (Vite envs; DO NOT COMMIT real secrets)

```
VITE_API_BASE=http://localhost:5000/api/v1
VITE_SENTRY_DSN=
VITE_FEATURE_FLAG_X=true
```

Best practices

- Maintain `.env.example` files in both client and server.
- Use secret manager or environment injection in CI/CD.

---

Building & deploying (recommendations)

Frontend

- Build static assets with `npm run build` in client.
- Serve static files via CDN / Nginx / Netlify / Vercel.
- Use CloudFront and long-lived caching for images (Cloudinary handles this).

Backend

- Deploy Node app behind a process manager or container (PM2, Docker).
- Use managed MongoDB (Atlas) for production reliability.
- Set environment variables in hosting environment (Heroku, DigitalOcean App Platform, ECS, etc.)
- Use TLS / HTTPS; ensure CORS is restricted to known origins.

Docker (recommended pattern)

- Build client image and copy build output to nginx image to serve static assets.
- Run server in Node image.
- docker-compose for local prod-like environment: services: api, web (nginx), mongo (official image).
- Use environment secrets in compose or external env files (avoid committing).

Health & monitoring

- Add /health endpoint and metrics export.
- Integrate Sentry or similar for error tracking.
- Aggregate logs (ELK / LogDNA).

---

Testing, linting & CI

Testing

- Backend: add Jest + Supertest for controllers and integration tests.
- Frontend: add React Testing Library + Jest for components.
- End-to-end: Playwright or Cypress for critical user flows (admin editor, ticket purchase).

Linting & formatting

- ESLint and Prettier already configured (see .prettierrc and eslint.config.js)
- Run `npm run lint` / `npm run format` in client and server as defined in package.json.

Recommended CI (GitHub Actions)

- Steps: checkout -> setup node -> install -> lint -> test -> build -> upload artifacts / deploy.

---

Troubleshooting & debugging

Common issues

- 401/403: ensure client api client attaches Authorization header (look at client/src/services/api.js) and JWT_SECRET matches token issuer on server.
- Uploads fail: check Cloudinary credentials and multer limits in server/src/middlewares/multer.middleware.js.
- Lightbox scroll issue: fixed by mounting ImageLightbox in a portal and locking body scroll (see "Recommended fixes" below).
- DB connection: check server logs and MONGO_URI.

Debugging tips

- Check server logs (console and error stack) — app uses asyncHandler and central error middleware in server/src/utils/error.js.
- Test API endpoints with Postman; inspect route handler in server/src/routes and controller logic in server/src/controllers.
- Use browser devtools network tab to confirm requests and payload shapes (FormData vs JSON).

---

Security considerations

- Do not commit .env files or secrets.
- Validate and sanitize inputs server-side (validator.middleware.js).
- Restrict file upload types and size in multer middleware.
- Use HTTPS in production; enable secure cookie flags for auth cookies; prefer Authorization headers.
- Rate-limit public endpoints to reduce abuse (rateLimit.middleware.js).
- Limit CORS origins, especially for admin endpoints.

---

Contributing, code style & PR checklist

Before opening a PR

- Pull latest main, rebase your branch.
- Run lint and tests locally:
  - client: cd client && npm run lint && npm test
  - server: cd server && npm run lint && npm test
- Ensure new env vars are documented in README and `.env.example` added.

PR checklist

- Title & description: what changed, why, which files
- Tests: unit/integration for behavioral changes
- Lint: passes ESLint and Prettier
- Docs: update README if public API or env vars changed
- Migration notes: if database schema changed, add migration steps

Coding style

- Functional React components & hooks
- Keep API logic in client/services; UI in components
- Use async/await with try/catch; server controllers use asyncHandler to forward errors

---

Recommended improvements / roadmap (prioritized)

High priority

1. ImageLightbox: convert to React portal, add body scroll lock and keyboard navigation (Esc/arrow) for accessibility.
2. Centralize API error handling and retries in client services (expose consistent error objects).
3. Add integration tests for Arvantis admin workflows (create/edit media/bulk delete).

Medium priority

1. Add Dockerfile(s) + docker-compose for local dev + production parity.
2. Move heavy file uploads to direct-to-cloud signed upload to reduce server memory/IO.
3. Add React Query caching across admin pages for smoother UX.

Low priority

1. Add role-based UI controls and feature flags.
2. Implement audit logs for admin changes (who changed what and when).
3. Add end-to-end checkout flow tests (ticketing + payment provider integration).

---

Appendix: useful file references (open these first)

Frontend

- client/src/main.jsx (app entry)
- client/src/services/api.js (axios + auth)
- client/src/services/arvantisServices.js (festival service)
- client/src/components/Arvantis/ImageLightbox.jsx (lightbox)
- client/src/components/Arvantis/EventsGrid.jsx (event tiles)
- client/src/pages/arvantis/editArvantis.jsx (admin editor UI)

Backend

- server/src/app.js (express app initialization)
- server/src/server.js (server bootstrap)
- server/src/routes/arvantis.routes.js (route wiring)
- server/src/controllers/arvantis.controller.js (fest controllers)
- server/src/models/arvantis.model.js (fest schema)
- server/src/utils/arvantisMedia.js (media normalization)
- server/src/middlewares/multer.middleware.js (upload validation)
- server/src/utils/cloudinary.js (cloudinary wrapper)

---