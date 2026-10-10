# Product Requirements Document — ReWear

**Product:** ReWear — Clothing Exchange & Swap Marketplace
**Version:** 1.0 (Phase 1)
**Document owner:** Project intern
**Status:** Implemented (see `docs/TEST_REPORT.md` for verification status)

---

## 1. Project overview

ReWear is a web marketplace where people exchange pre-owned clothes directly with each other instead of buying new ones. Members list garments they no longer wear, browse items from others, propose swaps by offering one of their own items, negotiate in a built-in chat and confirm the exchange once items have changed hands (in person or by courier). There is **no money involved** — ReWear is a barter platform.

To make swaps fair and convenient, ReWear provides:

- a deterministic **swap value calculator** that estimates each item's value from category, brand and condition, and compares two items side by side;
- **location-based matching** that surfaces items and members near the user's city and suggests fair swaps nearby;
- an **administrator panel** for moderation, dispute resolution and platform analytics.

## 2. Problem statement

- Many people own clothes in good condition that they no longer use, but have no easy way to exchange them.
- Traditional e-commerce platforms focus on buying and selling.
- Resale platforms involve complicated pricing, fees and payments.
- There are few platforms dedicated specifically to clothing swaps.
- Sustainable fashion options are limited or expensive for many users.

Fast fashion drives high clothing consumption and textile waste. Keeping garments in use for longer is one of the simplest ways to reduce that impact.

## 3. Objectives

### Primary objectives
1. Provide a marketplace dedicated to clothing exchange.
2. Enable users to swap clothes directly without monetary transactions.
3. Encourage sustainable fashion practices.
4. Provide location-based swap matching.

### Secondary objectives
1. Enable negotiation between users before finalising swaps.
2. Provide estimated swap value calculation.
3. Allow users to filter clothes by category and location.
4. Support remote swaps by courier (users agree courier details in chat; see §13 for full courier integration as a future enhancement).
5. Build a community around sustainable fashion (public profiles, nearby members).

## 4. Scope

### In scope (Phase 1) — all implemented
| Area | Delivered |
|---|---|
| User registration and login | Email + password, bcrypt hashing, JWT in httpOnly cookie, role-based access |
| Clothing listing system | Create / edit / remove listings, up to 4 photos, availability status |
| Swap request system | Send, accept, reject, cancel, confirm-exchange, full status history |
| Negotiation chat | One conversation per swap, participants only, auto-refresh |
| Swap value calculator | Rule-based formula, ±25% owner adjustment, fair-match comparison |
| Location-based swap suggestions | City-level location, radius search, nearby items/members, fair nearby matches |
| Admin management panel | KPIs, users, listings, swaps, reports/disputes |

### Out of scope (Phase 1)
- Online payment system (no prices, carts or payments anywhere in the product)
- AI-powered fashion recommendations (the value calculator is explicitly rule-based, not AI/ML)
- AR virtual clothing try-on
- Mobile application version (the web app is fully responsive instead)
- Automated courier booking / shipping labels

## 5. User roles

| Role | Description | Capabilities |
|---|---|---|
| Visitor | Not logged in | View landing page, browse/search listings, view item details and public profiles |
| Customer (member) | Registered user | Everything a visitor can do, plus: manage profile & location, create/edit/remove own listings, upload photos, send/accept/reject/cancel/confirm swaps, chat with swap partners, see nearby swaps & suggestions, report listings/users, open disputes |
| Administrator | Created only via the `create-admin` script | Everything a customer can do, plus: platform KPIs and analytics, user management (suspend/reactivate), listing moderation (edit/remove/restore), monitor all swaps, read swap chats (read-only) for disputes, resolve/dismiss reports |

## 6. Functional requirements

### 6.1 User module
| ID | Requirement | Implementation |
|---|---|---|
| FR-U1 | Register with name, email, password and city | `POST /api/auth/register`; password ≥ 8 chars with a letter and a number |
| FR-U2 | Log in / log out | `POST /api/auth/login`, `POST /api/auth/logout` |
| FR-U3 | Create and edit a personal profile | `PATCH /api/users/me` (name, bio, private phone, city, neighbourhood + visibility, preferred sizes) |
| FR-U4 | Upload clothing listings with details | Listing form (Dashboard → List an item) |
| FR-U5 | Browse available clothing items | Listings page with search, filters, sort, pagination |
| FR-U6 | Send swap requests | "Propose a swap" on the item page |
| FR-U7 | Manage swap history | Swaps page (Incoming / Outgoing / History) with timelines |

### 6.2 Clothing listing module
| ID | Requirement | Implementation |
|---|---|---|
| FR-L1 | Upload clothing images | Up to 4 JPEG/PNG/WebP, ≤ 2 MB each, signature-checked, stored in MongoDB |
| FR-L2 | Add type, size, brand, condition, category, colour, audience | Validated on client and server |
| FR-L3 | Set estimated swap value | Server calculates; owner may fine-tune within ±25% |
| FR-L4 | Display availability status | `available`, `reserved`, `swapped`, `removed` badges |
| FR-L5 | Edit or remove listings | Owners edit/remove available items; reserved items are locked |

### 6.3 Swap request module
| ID | Requirement | Implementation |
|---|---|---|
| FR-S1 | Send a swap request to another user, offering one of your items | Server validates ownership and availability |
| FR-S2 | View incoming and outgoing requests | Swaps page tabs, dashboard summary |
| FR-S3 | Accept or reject requests | Only the owner of the requested item |
| FR-S4 | Track swap status | `pending → accepted → completed`, or `rejected` / `cancelled`; timeline of every change |
| FR-S5 | Prevent duplicate and conflicting swaps | Unique partial index + conditional updates; accepting reserves both items and closes conflicting requests |
| FR-S6 | Keep listing availability consistent | Accepted → both items `reserved`; completed (both confirm) → `swapped`; cancelled → `available` |

### 6.4 Negotiation chat module
| ID | Requirement | Implementation |
|---|---|---|
| FR-C1 | Direct messaging between users | One conversation per swap request |
| FR-C2 | Discuss swap details / negotiate | Messages + system messages for each status change |
| FR-C3 | Confirm swap agreement | "Accept" (agreement) and "Confirm exchange" (both parties) actions available inside the chat |
| FR-C4 | Restrict to participants | Non-participants get 403; admins can read but not post |

### 6.5 Swap value calculator
| ID | Requirement | Implementation |
|---|---|---|
| FR-V1 | Estimate value from brand, condition and category | `estimate = round10(categoryBase × brandMultiplier × conditionMultiplier)` |
| FR-V2 | Suggest fair swap matches | "Fair swaps for you" and nearby suggestions; fair = difference ≤ 20% of the higher value or ≤ ₹150 |
| FR-V3 | Display value comparison for both items | Bars, absolute difference and fair-match badge in the proposal dialog, swap cards and chat |

### 6.6 Location-based matching
| ID | Requirement | Implementation |
|---|---|---|
| FR-G1 | Show nearby users offering swaps | "Members swapping nearby" on the Profile & Nearby page |
| FR-G2 | Filter listings by location | City filter and distance radius on Browse |
| FR-G3 | Suggest nearby swap opportunities | Nearby fair-value suggestions ranked by distance |

### 6.7 Admin module
| ID | Requirement | Implementation |
|---|---|---|
| FR-A1 | Manage users and listings | Search, suspend/reactivate users; edit/remove/restore listings |
| FR-A2 | Monitor swap activities | All swaps with status filter, values and chat access |
| FR-A3 | Remove inappropriate listings | Soft-remove with moderation note; open swaps on the item are closed |
| FR-A4 | Resolve disputes | Reports queue (listing/user/swap) with resolve/dismiss + admin note |
| FR-A5 | Generate platform analytics | KPIs + breakdowns by status, category and city |

## 7. Non-functional requirements

| Requirement | How it is met |
|---|---|
| Secure authentication | bcrypt (cost 12), JWT in httpOnly + SameSite=Lax + Secure (prod) cookie, generic login errors, rate-limited auth endpoints, suspended accounts blocked on every request |
| Mobile-responsive design | Bootstrap 5 grid + custom responsive CSS; tested breakpoints for phone, tablet, desktop |
| Fast search & listing performance | MongoDB indexes on status/category/date, city, value, owner and 2dsphere geo; paginated queries |
| Secure data storage | Secrets only in environment variables; passwords never stored in plain text; unknown body fields dropped (no mass assignment); regex input escaped |
| Scalable architecture | Stateless API (JWT), single deployable service, MongoDB Atlas; images can move to object storage later without API changes |
| User privacy | Only city (and optional neighbourhood, by consent) is public; email/phone never shown to other users; distances are rounded and computed between city centres |

## 8. User flows

### 8.1 Member flow
1. Register (name, email, password, city) → redirected to "List an item".
2. Complete profile (bio, neighbourhood visibility, sizes).
3. Upload a clothing listing — the estimated swap value is shown live.
4. Browse other listings (search, filter by category/size/condition/city/distance).
5. Open an item → **Propose a swap** → choose one of your items (closest values first) → see value comparison → send.
6. Negotiate in the swap chat (meet-up spot, courier details).
7. Owner accepts → both items become **reserved**; competing requests are closed automatically.
8. Ship items or exchange locally → each person clicks **Confirm exchange** → swap **completed**, items marked **swapped**, swap counts increase.

### 8.2 Admin flow
1. Log in with an administrator account → **Admin** appears in the navigation.
2. Monitor user activity and KPIs on **Overview**.
3. Manage listings (edit, remove, restore).
4. Resolve disputes in **Reports** (read the swap chat if needed, then resolve or dismiss).
5. Review platform reports (status / category / city breakdowns).

## 9. Data requirements

**Clothing data:** item ID, title, description, category, clothing type, brand, size, condition, colour, audience, estimated swap value (+ calculated value and breakdown), images, owner, general location (city/state + city-centre coordinates), availability status, timestamps.

**User data:** name, contact details (email, optional phone — private), location (city/state, optional neighbourhood with visibility consent), role, account status, swap history (swap requests + completed-swap counter), timestamps.

Seed data: 10 demo members across 10 Indian cities and 39 realistic listings (brands such as Levi's, Fabindia, Zara, Nike, Biba, Uniqlo, The North Face), plus example swaps in every state, chat messages and a report. See `docs/DATABASE_SCHEMA.md` for the full schema.

## 10. Key performance indicators

| KPI | Definition (as computed by `GET /api/admin/stats`) |
|---|---|
| Number of clothing listings | Listings with status available, reserved or swapped |
| Number of successful swaps | Swap requests with status `completed` |
| User engagement rate | % of members who have sent at least one swap request |
| Swap request conversion rate | Completed swaps ÷ all swap requests |
| Active users | Active (non-suspended) members seen in the last 30 days |
| (Extra) Acceptance rate | (Accepted + completed) ÷ decided requests |

## 11. Assumptions & constraints

**Assumptions**
- Users are willing to exchange clothing items.
- Users upload accurate clothing information.
- Courier services are available for remote swaps (arranged by users).

**Constraints**
- Item quality depends on users; ReWear does not inspect garments.
- Swap fairness depends on negotiation between users; values are estimates only.
- Shipping costs may affect swap decisions and are agreed between users.
- Location is city-level by design; distance is approximate.

## 12. Acceptance criteria

| # | Criterion |
|---|---|
| AC1 | A visitor can register and log in; invalid input shows field-level errors; wrong credentials show a generic error. |
| AC2 | Protected pages redirect to login; admin pages are inaccessible to customers (UI and API return 403). |
| AC3 | A member can create, edit and remove a listing with photos; the estimated value is computed by the server. |
| AC4 | Browse supports keyword search, category/size/condition/city filters, distance radius, sorting and pagination. |
| AC5 | A member cannot request a swap for their own item, offer someone else's item, or send a duplicate open request. |
| AC6 | The owner can accept or reject; accepting reserves both items and closes conflicting requests; completed swaps mark both items as swapped only after both confirm. |
| AC7 | Only the two participants can send messages in a swap chat; closed swaps are read-only. |
| AC8 | Value comparison (both values, difference, fair-match flag, disclaimer) appears when proposing and reviewing swaps. |
| AC9 | Nearby page lists items and members within a chosen radius and suggests fair nearby swaps; email/phone are never shown publicly. |
| AC10 | Admin can view KPIs, suspend/reactivate users, remove listings and resolve reports. |
| AC11 | The application is deployed and reachable through a public HTTPS link. |

## 13. Future enhancements
- AI-based swap recommendations (style and size preferences).
- Native mobile application.
- Clothing condition verification system (photo checks, trusted reviewers).
- Sustainability impact tracker (water and CO₂ saved per swap).
- Community fashion groups and swap events.
- Courier integration (pickup booking, tracking, shipping-cost split).
- Real-time chat over WebSockets (currently auto-refreshing every 4 seconds).
- Image storage on a CDN/object store (e.g., Cloudinary or S3) for very large catalogues.
- Ratings and reviews after completed swaps.
