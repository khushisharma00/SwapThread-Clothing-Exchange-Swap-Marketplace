# Project Plan — ReWear: Clothing Exchange & Swap Marketplace

| | |
|---|---|
| **Project** | ReWear — Clothing Exchange & Swap Marketplace |
| **Type** | Internship project (full-stack web application) |
| **Stack** | React + Bootstrap 5 · Node.js + Express · MongoDB (Mongoose) · Render + MongoDB Atlas |
| **Phase** | Phase 1 (MVP) — payments, AI recommendations, AR try-on and mobile app are out of scope |
| **Related docs** | [PRD](PRD.md) · [Database schema](DATABASE_SCHEMA.md) · [Test report](TEST_REPORT.md) · [README](../README.md) |

---

## 1. Goal

Build and deploy a web marketplace where people **exchange pre-owned clothes directly, without money**, so that clothing stays in use for longer and less textile waste is produced.

**Definition of done:** the app is live on a public HTTPS link, the code is on GitHub with CI passing, and the portal has received all four links (GitHub repo, project report, deployed site, feedback video).

## 2. Objectives → deliverables

| Objective (from guidelines) | Deliverable |
|---|---|
| List clothes for exchange | Listing CRUD with photos, size, brand, condition, availability |
| Browse and discover clothes | Search, filters (category, size, condition, city, distance), sorting |
| Send / accept / reject / track swaps | Swap state machine: pending → accepted → completed, rejected, cancelled |
| Negotiation messaging | One chat per swap, participants only |
| Estimate and compare swap values | Rule-based value calculator + fair-match comparison |
| Nearby exchange opportunities | City-level location, radius search, nearby suggestions |
| Admin management | KPIs, user suspension, listing moderation, reports/disputes |
| Promote clothing reuse | Swap-only flow (no prices), "garments given a new life" stats |

## 3. Scope

**In scope (Phase 1):** user registration and login · clothing listings · swap requests · negotiation chat · swap value calculator · location-based suggestions · admin panel.

**Out of scope:** online payments · AI recommendations · AR try-on · native mobile app · automated courier booking.

## 4. Architecture decisions

| Decision | Choice | Reason |
|---|---|---|
| Deployment shape | One Render web service: Express serves the API and the built React app | Simplest setup; the auth cookie works on one domain without CORS issues |
| Authentication | bcrypt + JWT in an httpOnly cookie | Secure by default; token not readable by JavaScript |
| Swap consistency | Conditional atomic updates with rollback instead of transactions | Works on free Atlas and on a local standalone MongoDB |
| Image storage | Images in MongoDB (≤ 2 MB each) | Render's free disk is wiped on redeploy; no extra Cloudinary account needed |
| Chat | REST + 4-second polling | Reliable on free hosting; Socket.IO is a future enhancement |
| Location | City-level centroids only | Protects privacy; distances are approximate by design |
| Value estimate | `category base × brand tier × condition` | Deterministic and explainable; no AI claims |

## 5. Work breakdown & timeline

Status key: ✅ done · ⏳ to do (needs your accounts or actions)

### Phase A — Planning & design
| # | Task | Output | Status |
|---|---|---|---|
| A1 | Read the guidelines PDF and extract requirements | Requirement list | ✅ |
| A2 | Write the PRD (scope, roles, functional/non-functional requirements, KPIs, acceptance criteria) | `docs/PRD.md` | ✅ |
| A3 | Design the database schema and relationships | `docs/DATABASE_SCHEMA.md` | ✅ |
| A4 | Choose the architecture and folder structure | README §4–5 | ✅ |
| A5 | Define brand and UI (green / cream / charcoal palette, logo) | `client/src/styles/theme.css` | ✅ |

### Phase B — Backend (Node.js + Express + MongoDB)
| # | Task | Output | Status |
|---|---|---|---|
| B1 | Project setup, environment configuration, DB connection | `server/src/config/*` | ✅ |
| B2 | Mongoose models: User, Listing, Image, SwapRequest, Conversation, Message, Report | `server/src/models/*` | ✅ |
| B3 | Auth: register, login, logout, JWT, roles, rate limiting | `authController`, `middleware/auth` | ✅ |
| B4 | Listings CRUD, search, filters, radius search, image upload | `listingController`, `imageController` | ✅ |
| B5 | Swap value calculator | `services/valueCalculator.js` | ✅ |
| B6 | Swap state machine (create, accept, reject, cancel, confirm) | `services/swapService.js` | ✅ |
| B7 | Negotiation chat API | `conversationController` | ✅ |
| B8 | Profiles, dashboard stats, nearby matching | `userController`, `listings/nearby` | ✅ |
| B9 | Reports/disputes and admin API with KPIs | `reportController`, `adminController` | ✅ |
| B10 | Security: helmet, CORS, validation, upload checks, error handling | `middleware/*`, `utils/validate.js` | ✅ |
| B11 | Seed data script and admin creation script | `scripts/seed.js`, `scripts/createAdmin.js` | ✅ |

### Phase C — Frontend (React + Bootstrap)
| # | Page / task | Route | Status |
|---|---|---|---|
| C1 | Layout, navigation, landing page | `/` | ✅ |
| C2 | Page 1 — Authentication | `/login`, `/register` | ✅ |
| C3 | Page 2 — Clothing listings | `/listings` | ✅ |
| C4 | Page 3 — Item details + propose swap | `/listings/:id` | ✅ |
| C5 | Page 4 — Swap requests | `/swaps` | ✅ |
| C6 | Page 5 — Negotiation chat | `/chat/:swapId` | ✅ |
| C7 | Page 6 — User dashboard + listing form | `/dashboard`, `/dashboard/listings/new` | ✅ |
| C8 | Page 7 — Admin panel | `/admin` | ✅ |
| C9 | Page 8 — Profile & nearby swaps | `/profile`, `/users/:id` | ✅ |
| C10 | Responsive design, loading/empty/error states, accessibility | all pages | ✅ |

### Phase D — Testing & quality
| # | Task | Output | Status |
|---|---|---|---|
| D1 | Unit tests: value calculator, location, validation (15) | executed — 15/15 passed | ✅ |
| D2 | API integration tests: auth, listings, swaps, chat, admin, users (60) | written in `server/tests/` | ✅ written |
| D3 | GitHub Actions CI (tests + client build) | `.github/workflows/ci.yml` | ✅ |
| D4 | **Run the full suite locally:** `npm test` | 75/75 passed (9 test suites) | ✅ |
| D5 | **Check the first CI run is green** on GitHub → Actions | green tick | ⏳ |
| D6 | Manual end-to-end test on the live site (checklist in TEST_REPORT §4) | filled-in checklist | ⏳ |
| D7 | Update `docs/TEST_REPORT.md` with the actual results | updated report | ✅ |

### Phase E — Deployment & submission
| # | Task | Details | Status |
|---|---|---|---|
| E1 | Unzip the project and open the **folder** in VS Code | File → Open Folder | ✅ |
| E2 | Install dependencies | `npm run install:all` | ✅ |
| E3 | Create a free MongoDB Atlas cluster, user and connection string | README §13 step 1 | ⏳ |
| E4 | Configure `server/.env` and run locally | `npm run dev:server` + `npm run dev:client` | ⏳ |
| E5 | Push to GitHub (`rewear-clothing-swap-marketplace`) | README §14 | ⏳ |
| E6 | Deploy on Render (Blueprint) with `MONGODB_URI` and `CLIENT_ORIGIN` | README §13 step 3 | ⏳ |
| E7 | Seed the live database and create the admin account | `npm run seed`, `npm run create-admin` | ⏳ |
| E8 | Replace screenshots with ones from the live site; add the live URL to the README | `docs/screenshots/` | ⏳ |
| E9 | Record the feedback video (3–5 min) | see §8 | ⏳ |
| E10 | Submit all four links on the internship portal | see §9 | ⏳ |

## 6. Schedule for the remaining work

| Step | Tasks | Est. time |
|---|---|---|
| 1 | E1–E4: set up and run locally | 20 min |
| 2 | D4: run `npm test` and fix anything that fails | 10 min |
| 3 | E5 + D5: push to GitHub and check CI | 10 min |
| 4 | E6–E7: deploy to Render and seed the database | 20 min |
| 5 | D6–D7 + E8: test the live site, update the test report and screenshots | 20 min |
| 6 | E9: record the feedback video | 20 min |
| 7 | E10: submit on the portal | 5 min |
| | **Total** | **≈ 1 h 45 min** |

## 7. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Atlas connection fails on Render | Site shows errors | Allow `0.0.0.0/0` in Atlas Network Access; check `/api/health` |
| Login works locally but not on Render | Users can't log in | Set `CLIENT_ORIGIN` to the exact Render URL; keep `NODE_ENV=production` |
| Render free instance is asleep | First load is slow (~1 min) | Open the site yourself just before evaluation |
| A test fails on the first run | CI turns red | Read the failing test name, fix it, push again; ask for help with the error |
| `.env` committed by mistake | Secrets leak | `.env` is in `.gitignore`; run `git status` before every commit |
| Weak demo data | Site looks empty | Run `npm run seed` (10 users, 39 listings, swaps, chats, a report) |

## 8. Feedback video outline (3–5 minutes)

1. **Intro (30 s):** your name, the project and the problem it solves (textile waste, no payment-free swap platform).
2. **Demo (2–3 min):** register → list an item → browse with filters → propose a swap with the value comparison → chat → accept → confirm → dashboard → nearby swaps → admin KPIs.
3. **Tech (45 s):** React, Express, MongoDB, JWT security, the value formula, deployment on Render.
4. **Learnings (45 s):** what was challenging (swap consistency, privacy-aware location), what you learned, and future enhancements.

Upload it to YouTube as **Unlisted** (or to Google Drive with "Anyone with the link can view").

## 9. Portal submission checklist

All links must start with `https://`.

- [ ] **GitHub Repository Link** — `https://github.com/<your-username>/rewear-clothing-swap-marketplace`
- [ ] **Detailed Project Report Link** — `https://github.com/<your-username>/rewear-clothing-swap-marketplace/blob/main/docs/PRD.md`
- [ ] **Project Deployed Link** — `https://<your-service>.onrender.com`
- [ ] **Project Feedback Video Link** — YouTube (unlisted) or Google Drive link

Before you submit:
- [ ] The CI badge or Actions tab shows a green run
- [ ] The live site loads and `/api/health` shows `"database":"connected"`
- [ ] Demo login works and listings are visible
- [ ] Every link opens in a private/incognito browser window

## 10. Future enhancements (Phase 2)

- AI-based swap recommendations
- Native mobile app
- Clothing condition verification
- Sustainability impact tracker
- Community fashion groups and swap events
- Courier integration
- Real-time chat over WebSockets
- Ratings and reviews after completed swaps
