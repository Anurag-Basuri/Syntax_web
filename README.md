# Syntax Club — Full Stack Platform

Comprehensive README for the Syntax Club application (frontend + backend). This repository contains a production-ready administration and public-facing platform for club management and the annual tech fest ("Arvantis"). The project is structured to be modular, testable and easy to extend.

---

Table of contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Key Files & Components](#key-files--components)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Surface & Routes](#api-surface--routes)
- [Styling & Theming](#styling--theming)
- [Performance & UX Notes](#performance--ux-notes)
- [Deploy & Production Recommendations](#deploy--production-recommendations)
- [Contributing & Code Style](#contributing--code-style)
- [Useful Links (in-repo)](#useful-links-in-repo)

---

## Project overview

Syntax Club is a full-stack web application that supports:

- Member management and roles (admin, member, leader)
- Event creation, ticketing and QR generation
- An annual tech fest (Arvantis) module — editions, events, partners, gallery, media
- Public landing pages and an admin dashboard

The repo is split into two main parts:

- Frontend: `client/` — React + Vite + Tailwind based SPA
- Backend: `server/` — Node.js + Express API with MongoDB models and controllers

---

## Tech stack

Frontend

- React (Vite) + JSX
- TailwindCSS + custom CSS modules (`index.css`, `arvantis.css`, `design.css`)
- React Query (`@tanstack/react-query`) for remote data fetching & caching
- Framer Motion for micro-animations
- Lucide icons
- Lazy loaded components (React.lazy + Suspense) for large UI (lightbox)
- ES modules via Vite

Backend

- Node.js + Express
- MongoDB (mongoose models)
- Middleware: auth, validation, rate limiting, multer for uploads
- Utilities: Cloudinary helper, asyncHandler, ApiError/ApiResponse helpers
- Organized controllers, models, routes and services

Other tools

- ESLint / Prettier configuration
- Tailwind configuration
- NPM scripts for dev/build/start

---

## Repository layout

Top-level folders:

- [client](client/) — frontend SPA
- [server](server/) — backend API

Important client files:

- [client/package.json](client/package.json)
- [client/vite.config.js](client/vite.config.js)
- [client/tailwind.config.js](client/tailwind.config.js)
- [client/index.html](client/index.html)
- [client/src/main.jsx](client/src/main.jsx)
- [client/src/index.css](client/src/index.css)
- [client/src/arvantis.css](client/src/arvantis.css)

Frontend components (Arvantis / pages):

- [client/src/components/Arvantis/PosterHero.jsx](client/src/components/Arvantis/PosterHero.jsx)
- [client/src/components/Arvantis/EventsGrid.jsx](client/src/components/Arvantis/EventsGrid.jsx)
- [client/src/components/Arvantis/GalleryGrid.jsx](client/src/components/Arvantis/GalleryGrid.jsx)
- [client/src/components/Arvantis/ImageLightbox.jsx](client/src/components/Arvantis/ImageLightbox.jsx)
- [client/src/components/Arvantis/GlassCard.jsx](client/src/components/Arvantis/GlassCard.jsx)
- Page wrapper: [client/src/pages/arvantis/arvantis.jsx](client/src/pages/arvantis/arvantis.jsx)

Important server files:

- [server/package.json](server/package.json)
- App entry: [server/src/app.js](server/src/app.js)
- Server bootstrap: [server/src/server.js](server/src/server.js)
- Routes: [server/src/routes/arvantis.routes.js](server/src/routes/arvantis.routes.js)
- Controller: [server/src/controllers/arvantis.controller.js](server/src/controllers/arvantis.controller.js)
- Models: [server/src/models/arvantis.model.js](server/src/models/arvantis.model.js), [server/src/models/event.model.js](server/src/models/event.model.js)
- Utilities: [server/src/utils/asyncHandler.js](server/src/utils/asyncHandler.js), [server/src/utils/cloudinary.js](server/src/utils/cloudinary.js)

---

## Key files & components (what to look at)

Frontend

- Landing & Arvantis page: [client/src/pages/arvantis/arvantis.jsx](client/src/pages/arvantis/arvantis.jsx) — main composition for the fest page, lazy-loads heavy UI such as the image lightbox.
- Poster / hero visuals & countdown: [client/src/components/Arvantis/PosterHero.jsx](client/src/components/Arvantis/PosterHero.jsx)
- Event tiles + lazy fetch of details: [client/src/components/Arvantis/EventsGrid.jsx](client/src/components/Arvantis/EventsGrid.jsx)
- Full-screen image viewer (lightbox): [client/src/components/Arvantis/ImageLightbox.jsx](client/src/components/Arvantis/ImageLightbox.jsx) — currently intended to open above content (see "Fixes" below).
- Styling: global tokens and theme are in [client/src/index.css](client/src/index.css) and page-specific rules in [client/src/arvantis.css](client/src/arvantis.css).

Backend

- Fest controllers & routing are in [server/src/controllers/arvantis.controller.js](server/src/controllers/arvantis.controller.js) and [server/src/routes/arvantis.routes.js](server/src/routes/arvantis.routes.js). They expose endpoints such as:
  - GET `/api/arvantis/landing` — latest landing data
  - GET `/api/arvantis/` — paginated list
  - GET `/api/arvantis/:identifier` — fest details by slug or year
- Event model includes a robust `mediaSchema` which enforces valid poster URLs: [server/src/models/event.model.js](server/src/models/event.model.js)

---

## Local development

1. Install dependencies

Frontend

```bash
cd client
npm install
```

Backend

```bash
cd server
npm install
```

2. Run dev servers (two terminals)
   Frontend

```bash
cd client
npm run dev
```

Backend

```bash
cd server
npm run dev
# or if server has nodemon: npm run start:dev
```

Check top-level README and each package.json for exact script names:

- [client/package.json](client/package.json)
- [server/package.json](server/package.json)

---

## Environment variables

Expected environment variables (examples — confirm in your `.env` files):

Server (.env)

- MONGO_URI — Mongo DB connection string
- JWT_SECRET — authentication secret
- CLOUDINARY_URL / CLOUDINARY_CLOUD_NAME / CLOUDINARY_KEY / CLOUDINARY_SECRET — optional for media uploads
- PORT — server listening port

Client (.env)

- VITE_API_BASE — API base URL for public calls (e.g. http://localhost:5000/api)
- Other Vite env vars for analytic keys or feature flags

See `.env` files in each folder for hints:

- [client/.env](client/.env) (if present)
- [server/.env](server/.env)

---

## API surface & routes

Look at the Arvantis routes for public endpoints:

- [server/src/routes/arvantis.routes.js](server/src/routes/arvantis.routes.js)

Important controller implementations:

- Fetch landing / latest: [server/src/controllers/arvantis.controller.js#getLatestFest](server/src/controllers/arvantis.controller.js)
- Event model + media validation: [server/src/models/event.model.js](server/src/models/event.model.js)

Frontend services calling API:

- [client/src/services/arvantisServices.js](client/src/services/arvantisServices.js) — normalize pagination, fetch landing and detail data
- [client/src/services/eventServices.js](client/src/services/eventServices.js) — fetch event by id used by `EventsGrid.jsx`

---

## Styling, accessibility & theming

- Global theme tokens are defined in [client/src/index.css](client/src/index.css) (CSS variables for light & dark).
- Arvantis-specific styles are in [client/src/arvantis.css](client/src/arvantis.css) and components use `glass-card` surfaces, `poster-main-img` rules, and responsive utilities.
- Responsive layout is implemented using Tailwind utility classes in components and grid layouts for events and gallery components (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
- Accessibility notes:
  - Buttons and images use ARIA labels and roles in `[client/src/components/Arvantis/EventsGrid.jsx](client/src/components/Arvantis/EventsGrid.jsx)`.
  - Focus-visible styles are present in `index.css` tokens.

---

## Bug fix: Lightbox scroll / position issue

Symptom: when opening an image lightbox the overlay scrolls with the page (not fixed to viewport). Root cause: the lightbox markup likely lives inside the page flow (not portal/fixed) or CSS lacks `position: fixed; inset: 0;` and `overflow: hidden` on body.

Quick solutions:

1. Use a React portal for the lightbox so it mounts at the document root:

   - Mount `ImageLightbox` with `createPortal` to `document.body`.
   - Ensure lightbox wrapper uses:
     - `position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;`
     - Backdrop `background: rgba(0,0,0,0.6)`.
   - Prevent body scroll while open:
     - On open: `document.body.style.overflow = 'hidden'`
     - On close: restore `document.body.style.overflow = ''`
   - See current lightbox: [client/src/components/Arvantis/ImageLightbox.jsx](client/src/components/Arvantis/ImageLightbox.jsx)

2. Alternative (CSS-only): ensure lightbox element is fixed and outside the page stacking context.

Suggested code (example to patch `ImageLightbox.jsx`) — see file to implement portal approach. This file currently exists at:

- [client/src/components/Arvantis/ImageLightbox.jsx](client/src/components/Arvantis/ImageLightbox.jsx)

---

## Performance & UX notes

- Heavy UI components are lazy-loaded (example: `ImageLightbox` is `React.lazy`) to improve initial bundle.
- Use React Query (`useQuery`) to fetch event brief data and cache results; examples in:
  - [client/src/components/Arvantis/EventsGrid.jsx](client/src/components/Arvantis/EventsGrid.jsx)
- Poster images support multiple shapes (Cloudinary, publicUrl, etc.) via robust helpers inside `EventsGrid.jsx`.
- Animations use `framer-motion` for subtle entrance effects.
- Keep images responsive with `object-cover` and appropriate `loading="lazy"` attributes.

---

## Deploy & production recommendations

- Build frontend with `npm run build` in `client/` and serve via CDN or static host (Netlify, Vercel, or behind a reverse proxy).
- Server should run with environment variables and a process manager (PM2) or inside a Docker container.
- Use HTTPS and secure cookies for auth.
- Offload media to Cloudinary / S3 and ensure URL shapes align with `mediaSchema` in [server/src/models/event.model.js](server/src/models/event.model.js).
- Add server-side rate limiting and input validation (already present as middleware).

---

## Contributing & code style

- ESLint and Prettier are configured — see:
  - [client/.eslintrc.js](client/.eslintrc.js) (if present)
  - [client/.prettierrc](client/.prettierrc)
- Follow existing component patterns (small presentational components in `client/src/components`, page composition in `client/src/pages`).
- Use `useQuery` for remote reads and central `services/*.js` for API calls.
- Write unit tests and add integration tests for API endpoints where possible.

---

## Useful links (open these files directly)

- Frontend entry & config:

  - [client/src/main.jsx](client/src/main.jsx)
  - [client/index.html](client/index.html)
  - [client/tailwind.config.js](client/tailwind.config.js)
  - [client/src/index.css](client/src/index.css)
  - [client/src/arvantis.css](client/src/arvantis.css)

- Arvantis UI:

  - [client/src/pages/arvantis/arvantis.jsx](client/src/pages/arvantis/arvantis.jsx)
  - [client/src/components/Arvantis/PosterHero.jsx](client/src/components/Arvantis/PosterHero.jsx)
  - [client/src/components/Arvantis/EventsGrid.jsx](client src/components/Arvantis/EventsGrid.jsx)
  - [client/src/components/Arvantis/ImageLightbox.jsx](client/src/components/Arvantis/ImageLightbox.jsx)
  - [client/src/components/Arvantis/GalleryGrid.jsx](client/src/components/Arvantis/GalleryGrid.jsx)

- Backend core:
  - [server/src/app.js](server/src/app.js)
  - [server/src/server.js](server/src/server.js)
  - [server/src/routes/arvantis.routes.js](server/src/routes/arvantis.routes.js)
  - [server/src/controllers/arvantis.controller.js](server/src/controllers/arvantis.controller.js)
  - [server/src/models/event.model.js](server/src/models/event.model.js)
  - [server/src/models/arvantis.model.js](server/src/models/arvantis.model.js)

---
