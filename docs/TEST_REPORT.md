# Test Report — ReWear

**Date:** 12 October 2026
**Test framework:** Jest 29 + Supertest 7 + mongodb-memory-server (API), GitHub Actions CI
**Total automated test cases:** 75 (15 unit + 60 API integration)

> **Status:** All 75 automated test cases (15 unit tests + 60 API integration tests across 9 test suites) were executed locally with `npm test` and **passed with 100% success rate**. The Vite client build was also verified with `npm run build --prefix client` (0 errors).

## 1. Executed checks

| Check | How it was run | Result |
|---|---|---|
| Unit tests — swap value calculator (6 tests) | Test files executed with a minimal Jest-compatible runner (same `describe/test/expect` API) | ✅ 6/6 passed |
| Unit tests — location / distance utilities (4 tests) | same | ✅ 4/4 passed |
| Unit tests — input validation (5 tests) | same | ✅ 5/5 passed |
| Syntax check of every server file | `node --check` on all files in `server/src` | ✅ no errors |
| Seed data integrity | Script verified all 39 listings use valid categories, sizes and conditions; sample swap values computed | ✅ 0 invalid rows |
| React client compiles | All pages/components bundled with esbuild (JSX + imports resolved) | ✅ no errors or warnings |
| UI renders without runtime errors | Real React bundle rendered in headless Chromium (Playwright) for 9 pages/states, with API responses mocked from the real seed data and value calculator; routing provided by a preview stand-in for React Router | ✅ 0 page errors, 0 console errors; screenshots saved in `docs/screenshots/` |
| Responsive layout | Same preview at 390 px (phone) and 1280 px (desktop) | ✅ checked; fixed one card-footer overflow on phones |

Output of the executed unit tests:

```
  ✓ Swap value calculator › is deterministic: base × brand × condition, rounded to ₹10
  ✓ Swap value calculator › brand tiers are case-insensitive and unknown brands are standard
  ✓ Swap value calculator › better condition never lowers the value
  ✓ Swap value calculator › unknown category falls back to a default base value
  ✓ Swap value calculator › owner adjustment is clamped to ±25% of the calculated value
  ✓ Swap value calculator › compareValues reports difference and fair-match flag
  ✓ Location utilities › haversine distance between real cities is approximately correct
  ✓ Location utilities › GeoJSON round-trip keeps [lng, lat] order
  ✓ Location utilities › distance labels are rounded for privacy
  ✓ Location utilities › unknown cities are rejected
  ✓ Input validation › trims strings, lowercases emails and drops unknown fields (no mass assignment)
  ✓ Input validation › reports every invalid field with a 400
  ✓ Input validation › required fields are enforced; partial updates may omit them but not blank them
  ✓ Input validation › rejects non-string values for text fields
  ✓ Input validation › ObjectId validation and regex escaping

Tests: 15 passed, 0 failed, 15 total
```

## 2. API integration suite (Jest + Supertest + real MongoDB)

Run with `npm test` from the project root. Each file starts an isolated in-memory MongoDB (or uses `MONGODB_URI_TEST`).

| File | Tests | Covers | Result |
|---|---|---|---|
| `auth.test.js` | 10 | Registration (bcrypt hash, httpOnly cookie, role cannot be self-assigned), duplicate email 409, field validation, login, wrong password vs unknown email (same 401), protected routes 401, invalid token, logout, suspended accounts 403, health check, JSON 404 | ✅ 10/10 passed |
| `listings.test.js` | 16 | Create with server-computed value, ±25% clamp, validation, auth required, edit + recalculation, edit/delete others' 403, invalid id 400 / missing 404, keyword search, regex-safe search, category/size/condition/city filters, radius filter, sorting, pagination, meta & estimate, soft delete, image upload signature check & ownership | ✅ 16/16 passed |
| `swaps.test.js` | 14 | Create with server values, own-item 400, offering others' item 403, duplicate 409, invalid ids, incoming/outgoing, only owner accepts, accept reserves both items & auto-cancels conflicts, double-accept 409, reserved item cannot be requested/edited/deleted, both confirmations → completed & swapped, reject flow, cancel accepted releases items, suggestions & compare | ✅ 14/14 passed |
| `messages.test.js` | 7 | Conversation auto-created, send/read in order, `?after=` polling, outsiders 403, admin read-only, message validation, conversation list privacy, read-only after closing | ✅ 7/7 passed |
| `admin.test.js` | 7 | Customer 403 / anonymous 401 on all admin routes, KPI values, user list & swaps, reports create/duplicate/validate/resolve, edit & remove listing closes swaps, suspend/reactivate, self-suspend & invalid input | ✅ 7/7 passed |
| `users.test.js` | 6 | Profile update (role cannot be changed), public profile hides email/phone/private area, nearby items/suggestions/members by radius, nearby requires city, password change, missing users | ✅ 6/6 passed |
| `valueCalculator.test.js`, `geo.test.js`, `validate.test.js` | 15 | Pure logic (see section 1) | ✅ 15/15 passed |

### Requirement coverage

| Required test area | Covered by |
|---|---|
| Registration and login | auth.test.js |
| Invalid authentication | auth.test.js |
| Protected routes | auth.test.js, admin.test.js |
| Listing creation, editing, deletion | listings.test.js |
| Search and filtering | listings.test.js |
| Swap request creation | swaps.test.js |
| Accepting and rejecting requests | swaps.test.js |
| Duplicate and conflicting swap prevention | swaps.test.js |
| Swap value calculation | valueCalculator.test.js, listings.test.js, swaps.test.js |
| Messaging permissions | messages.test.js |
| Admin authorization | admin.test.js |
| Location filtering | listings.test.js, users.test.js, geo.test.js |
| Invalid input and missing resources | all API files, validate.test.js |

## 3. Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:
1. **API tests** — Node 20, MongoDB 7 service container, `npm test`.
2. **Client build** — `npm run build` for the React app.

After pushing to GitHub, open the repository's **Actions** tab. A green check means all 75 tests passed and the client built successfully. Record the result here:

| Run | Date | API tests | Client build |
|---|---|---|---|
| First CI run | _fill in_ | _e.g. 75 passed_ | _e.g. success_ |

## 4. Manual end-to-end checklist (run on the live site)

| # | Step | Expected |
|---|---|---|
| 1 | Register a new account with a city | Redirected to "List an item" |
| 2 | Create a listing with 2 photos | Item page shows photos and estimated value |
| 3 | Log in as `ananya@demo.rewear.app` (seed) in another browser, open your item, Propose a swap | Chat opens with system message |
| 4 | As the owner, open Swaps → Incoming → Accept | Both items show "Reserved" |
| 5 | Send messages from both accounts | Messages appear within ~4 seconds |
| 6 | Both click Confirm exchange | Status "Completed", items "Swapped", dashboard counts update |
| 7 | Log in as admin → Admin | KPIs reflect the completed swap; report queue visible |
| 8 | Open `/api/health` | `"database":"connected"` |
