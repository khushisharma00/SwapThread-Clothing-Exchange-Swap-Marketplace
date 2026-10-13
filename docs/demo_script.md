# SwapThread — Feedback & Demonstration Video Script (3–5 Minutes)

> **Format:** Screen recording with voiceover (Loom, OBS Studio, or QuickTime Screen Recording + Microphone).  
> **Target Duration:** 3 to 5 minutes (approx. 450–650 spoken words).  
> **Resolution:** 1080p (Full HD) recommended.  
> **Privacy Note:** Ensure no browser passwords, secret `.env` tokens, or personal messages are visible during the recording.

---

## Pre-Recording Checklist (1 Minute Before Recording)

- [ ] Ensure local or live deployed backend is active (`/health` responds with `{"status":"ok"}`).
- [ ] Open a clean browser window (preferably Incognito / Private or clean profile).
- [ ] Have two browser profiles or windows ready:
  - **Window A:** Logged in as regular member (e.g. `ananya@demo.rewear.app` or your newly registered user).
  - **Window B:** Logged in as admin or a second user to demonstrate the swap flow and admin dashboard.
- [ ] Clear browser bookmarks bar and zoom to 100% or 110% for crisp readability.
- [ ] Keep this script open on your phone or split screen.

---

## Video Timeline & Script

```
00:00 - 00:35 │ Part 1: Project Overview & Motivation
00:35 - 01:25 │ Part 2: Product Walkthrough — Discovery & Valuation
01:25 - 02:30 │ Part 3: Core Barter Flow — Proposal, Chat, and Lifecycle
02:30 - 03:20 │ Part 4: Admin Governance, Architecture & Cloud Storage
03:20 - 04:30 │ Part 5: Personal Experience, Learnings & Closing Thoughts
```

---

### Part 1: Introduction & Project Overview (00:00 – 00:35)

**On Screen:**  
Start on the **SwapThread Landing Page (`/`)**. Scroll smoothly past the hero section, the value proposition, curated category cards, and the circular economy stats.

**Spoken Script:**  
> "Hello everyone! Welcome to my demonstration of **SwapThread**, a full-stack circular clothing exchange and barter marketplace.
> 
> The fashion industry is currently one of the leading contributors to global landfill waste, and fast fashion causes millions of wearable garments to be discarded prematurely. SwapThread solves this problem by enabling a zero-cash, direct garment barter ecosystem. Rather than selling clothes for depreciated cash or throwing them away, members can trade pre-loved clothes directly with peers. 
> 
> In this video, I will walk you through the key user journeys, our deterministic swap valuation engine, our two-phase barter state machine, and share my technical learnings from building this production-ready application."

---

### Part 2: Discovery, Filters & Swap Value Engine (00:35 – 01:25)

**On Screen:**  
Click **"Explore Marketplace"** to navigate to `/listings`.  
1. Type a search query (e.g., `"Denim"` or `"Jacket"`).
2. Filter by Category (`Outerwear`), Condition (`Like New`), and City (`Bangalore` or `Delhi`).
3. Click on a listing card to open the **Listing Details (`/listings/:id`)**.
4. Highlight the **Estimated Swap Value** badge and explanation.

**Spoken Script:**  
> "Here on the marketplace catalogue, users can browse hundreds of available garments using keyword search, multi-attribute filtering by category, size, garment condition, and Indian cities. 
> 
> One major challenge in barter economies is subjective valuation — how do two strangers agree on an exchange without money? To solve this, SwapThread features a transparent, rule-based **Swap Value Calculator**.
> 
> As you can see on this detail page, our algorithm calculates an estimated barter value based on category baseline price, verified brand tier, and garment wear condition. It tags swaps as 'Fair' when values are within 20% or ₹150 of each other. This creates trust without requiring complex negotiations or artificial currency."

---

### Part 3: The Barter Lifecycle & Negotiation Chat (01:25 – 02:30)

**On Screen:**  
1. Click the **"Propose Swap"** button. The modal pops up.
2. Select an item from your own wardrobe to offer. Show the real-time value difference comparison bar.
3. Submit the proposal.
4. Switch to the **Swaps Dashboard (`/swaps`)** showing the outgoing request in `Pending` status.
5. Switch to Window B (the receiver), show the incoming request notification, and click **"Accept Swap"**.
6. Click **"Open Chat"** to navigate to `/chat/:swapId`. Send a message: *"Hi! Would weekend drop-off in Indiranagar work for you?"*
7. Show the message appearing in real-time.
8. Show the status moving to `Accepted` (items automatically locked/reserved so they cannot be double-swapped) and show the final **"Confirm Exchange"** button.

**Spoken Script:**  
> "Now let's look at the core transaction flow. When I propose a swap, the modal compares my offered piece against the target item side by side.
> 
> Once submitted, our backend manages the entire transaction through a strict two-phase atomic state machine: `pending` to `accepted`, and finally `completed` once both parties physically receive their items.
> 
> Crucially, as soon as a swap proposal is accepted, our system automatically reserves both items across the marketplace, gracefully rejecting or withholding concurrent conflicting proposals. 
> 
> Inside the dedicated swap chat room, users securely coordinate logistics, drop-off locations, or courier tracking without sharing private phone numbers or personal emails."

---

### Part 4: Admin Governance, Cloud Storage & Architecture (02:30 – 03:20)

**On Screen:**  
1. Navigate to the **Admin Dashboard (`/admin`)** logged in as staff.
2. Highlight the KPI overview tiles: Total Users, Active Listings, Completed Swaps, and Environmental Metric (estimated kilograms of textile waste diverted).
3. Demonstrate the User Management tab (toggle suspension status) and Content Moderation tab.
4. Quickly mention Cloudinary image storage.

**Spoken Script:**  
> "For platform safety, SwapThread includes a comprehensive role-based Admin Console. Admins have real-time visibility into platform health, user accounts, flagged listings, and open swap disputes.
> 
> On the architectural side, the backend is built with Node.js and Express with strict CORS allowlisting, rate limiting, and Helmet security headers. Authentication is handled via httpOnly, SameSite cookies with bcrypt password hashing. 
> 
> For asset persistence on ephemeral cloud containers, we integrated **Cloudinary** for image uploads with an in-database binary buffer fallback, ensuring zero media loss during redeployments."

---

### Part 5: Personal Experience, Technical Learnings & Conclusion (03:20 – 04:30)

**On Screen:**  
Return to the browser home page or camera view.

**Spoken Script:**  
> "Building SwapThread was an incredibly rewarding full-stack experience that went far beyond building basic CRUD endpoints.
> 
> My biggest learning was designing resilient transactional state workflows. Unlike an e-commerce cart where transactions are instant, peer-to-peer barter involves asynchronous human decisions, concurrent race conditions, and mutual confirmation. Solving inventory reservation without distributed deadlocks taught me deep lessons in database concurrency and defensive API design.
> 
> I also gained hands-on experience hardening an application for production: configuring Cloudinary streams, setting up clean environment variable cascades, writing automated regression tests with 100% passing suites, and deploying a single-origin unified architecture.
> 
> Thank you so much for watching my demo! The repository is public on GitHub, the project report and documentation are linked in the submission, and the live application is ready to explore."

---

## Post-Recording Check

1. [ ] Check audio clarity: Voice is loud, clean, and audible over any background noise.
2. [ ] Check video length: Between 3:00 and 5:00 minutes.
3. [ ] Upload to YouTube (set to **Unlisted** or **Public**) or Loom (set to **Public / Anyone with the link**).
4. [ ] Verify that the video link opens and plays in a private/incognito browser window without login.
5. [ ] Copy the video URL (must start with `https://`) into your submission form!
