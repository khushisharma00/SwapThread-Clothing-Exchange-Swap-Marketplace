# Database Schema — ReWear (MongoDB / Mongoose)

All collections use Mongoose timestamps (`createdAt`, `updatedAt`). IDs are MongoDB ObjectIds.

```
User 1──* Listing *──* Image
User 1──* SwapRequest (as requester)      SwapRequest *──1 Listing (requestedListing)
User 1──* SwapRequest (as owner)          SwapRequest *──1 Listing (offeredListing)
SwapRequest 1──1 Conversation 1──* Message *──1 User (sender, null for system messages)
User 1──* Report (reporter) ──> target: Listing | User | SwapRequest
```

## users
| Field | Type | Notes |
|---|---|---|
| name | String | required, 2–60 chars |
| email | String | required, **unique**, lowercase — private |
| passwordHash | String | bcrypt (cost 12), `select: false` |
| role | `customer` \| `admin` | default `customer`; never settable through the API |
| status | `active` \| `suspended` | suspended users are blocked on every request |
| suspendedReason | String | ≤ 300 |
| bio | String | ≤ 300 |
| phone | String | ≤ 20 — private (owner & admin only) |
| location.city / location.state | String | from the city catalog |
| location.area | String | optional neighbourhood, ≤ 60 |
| location.showArea | Boolean | consent to show the neighbourhood publicly |
| geo | GeoJSON Point | **city-centre** coordinates `[lng, lat]`, never precise |
| preferredSizes | [String] | |
| avatarColor | String | |
| swapsCompleted | Number | incremented when a swap completes |
| lastActiveAt | Date | for the "active users" KPI |

Indexes: `email` (unique), `role`, `status`, `geo` (2dsphere, sparse).

## listings
| Field | Type | Notes |
|---|---|---|
| title | String | required, 3–80 |
| description | String | required, 10–1000 |
| category | enum | tops, shirts, tshirts, jeans, trousers, dresses, jackets, sweaters, ethnic, activewear, footwear, accessories |
| clothingType | String | e.g. "Denim jacket" |
| audience | `women` \| `men` \| `unisex` \| `kids` | |
| brand | String | required |
| size | enum | XS–XXL, waist 26–38, UK 4–10, Free Size |
| condition | `new_with_tags` \| `like_new` \| `good` \| `fair` | |
| color | String | optional |
| calculatedValue | Number | formula output (server) |
| estimatedValue | Number | displayed value; owner adjustment clamped to ±25% |
| valueBreakdown | Object | base, brand tier, multipliers |
| images | [ObjectId → Image] | max 4 |
| owner | ObjectId → User | set from the session, never from the client |
| location.city / location.state | String | general location only |
| geo | GeoJSON Point | city centre |
| status | `available` \| `reserved` \| `swapped` \| `removed` | `removed` = soft delete |
| moderationNote | String | set by admins |
| views | Number | |

Indexes: `geo` (2dsphere), `{status, category, createdAt}`, `{location.city, status}`, `owner`, `estimatedValue`, `status`.

## images
| Field | Type | Notes |
|---|---|---|
| data | Buffer | ≤ 2 MB, `select: false` |
| contentType | `image/jpeg` \| `image/png` \| `image/webp` \| `image/svg+xml` | SVG only for server-generated seed art |
| size | Number | bytes |
| owner | ObjectId → User | only the uploader can attach the image to a listing |
| generated | Boolean | true for seed illustrations |

## swaprequests
| Field | Type | Notes |
|---|---|---|
| requester | ObjectId → User | person offering an item |
| owner | ObjectId → User | owner of the requested item |
| requestedListing | ObjectId → Listing | |
| offeredListing | ObjectId → Listing | must belong to the requester |
| message | String | ≤ 500 |
| status | `pending` \| `accepted` \| `rejected` \| `cancelled` \| `completed` | |
| active | Boolean | true while pending/accepted |
| offeredValue / requestedValue / valueDifference / isFairMatch | Number / Boolean | snapshot computed by the server at request time |
| requesterConfirmed / ownerConfirmed | Boolean | both true → completed |
| exchangeMethod | `meetup` \| `courier` \| `undecided` | |
| history | [{status, by, note, at}] | full audit trail |
| completedAt | Date | |

Indexes: **unique partial** `{requester, requestedListing}` where `active: true` (no duplicate open requests), plus `requester`, `owner`, `requestedListing`, `offeredListing`, `status`.

### Consistency rules (no multi-document transactions required)
- Each state change is a conditional `findOneAndUpdate` (e.g. only `pending` → `accepted`), so concurrent clicks cannot both succeed.
- Accepting reserves both listings with conditional updates (`available` → `reserved`) and rolls back if any step fails.
- After acceptance, every other open request involving either item is cancelled automatically.
- Completion requires both confirmations and moves only `reserved` items to `swapped`.

## conversations
| Field | Type | Notes |
|---|---|---|
| swap | ObjectId → SwapRequest | **unique** (one conversation per swap) |
| participants | [ObjectId → User] | exactly 2 |
| lastMessageAt / lastMessagePreview | Date / String | for the inbox list |

## messages
| Field | Type | Notes |
|---|---|---|
| conversation | ObjectId → Conversation | |
| sender | ObjectId → User | null for system messages |
| kind | `user` \| `system` | system messages record status changes |
| body | String | 1–1000 chars |

Index: `{conversation, createdAt}`.

## reports
| Field | Type | Notes |
|---|---|---|
| reporter | ObjectId → User | |
| targetType | `listing` \| `user` \| `swap` | `swap` = dispute (participants only) |
| targetId | ObjectId | |
| reason | enum | inappropriate, misleading, counterfeit, no_show, item_not_as_described, harassment, spam, other |
| details | String | ≤ 1000 |
| status | `open` \| `resolved` \| `dismissed` | |
| adminNote / resolvedBy / resolvedAt | | set by admins |

## Swap value formula
`estimate = round to ₹10 ( categoryBase × brandMultiplier × conditionMultiplier )`

| Category base (₹) | | Brand tier | × | Condition | × |
|---|---|---|---|---|---|
| T-shirts 400 · Tops 500 · Accessories 500 | | Luxury (Gucci, Coach, Ralph Lauren…) | 2.5 | New with tags | 1.00 |
| Shirts 700 · Activewear 700 · Trousers 800 | | Premium (Levi's, Nike, Zara, Fabindia…) | 1.6 | Like new | 0.85 |
| Sweaters 900 · Jeans 1000 · Dresses 1200 | | Mid-range (H&M, Uniqlo, Biba, W…) | 1.2 | Good | 0.65 |
| Ethnic 1500 · Footwear 1600 · Jackets 1800 | | Other brands | 1.0 | Fair | 0.45 |

Fair match: `|a − b| ≤ 150` or `|a − b| ≤ 20% × max(a, b)`.
