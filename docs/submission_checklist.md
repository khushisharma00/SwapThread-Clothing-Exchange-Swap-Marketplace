# SwapThread — Final Project Submission Checklist

This document details the exact verification steps for the **4 required submission fields** based on the evaluation form.

---

## The 4 Submission Form Fields

| # | Form Field Name | Required Format / Value | Status / Action Required by You |
|---|---|---|---|
| **1** | **GitHub Repository Link** | `https://github.com/<your-username>/rewear-clothing-swap-marketplace` (must start with `https://`, Public repo) | ⚠️ **Action:** Create public repo on GitHub and push code using commands in Section 3 below. |
| **2** | **Project Report Link** | Google Drive shareable link (`https://drive.google.com/file/d/...`) set to **"Anyone with the link can view"** | ⚠️ **Action:** Upload generated `docs/project_report.pdf` (or `project_report.md`) to Google Drive and copy link. |
| **3** | **Live Deployed Application URL** | `https://<your-service>.onrender.com` (must start with `https://`) | ⚠️ **Action:** Complete Render deployment using click-by-click guide in README/docs, test `/health`, paste link. |
| **4** | **Feedback & Demo Video URL** | `https://youtu.be/...` or `https://www.loom.com/share/...` (3–5 min video, Unlisted or Public) | ⚠️ **Action:** Record screen using `docs/demo_script.md`, upload to YouTube/Loom, verify link. |

---

## Detailed Field-by-Field Verification Checklist

### Field 1: GitHub Repository URL
- [ ] **Protocol:** URL strictly begins with `https://`.
- [ ] **Visibility:** The GitHub repository is set to **Public** (not Private). Verify by opening the link in an Incognito / Private browser window without logging into GitHub.
- [ ] **Clean Git History:** 
  - [x] Verified zero `.env` or secret keys are committed in Git history (`.gitignore` verified).
  - [x] Verified `node_modules/`, `client/dist/`, `.data/`, and runtime logs are ignored.
- [ ] **Documentation in Repo:** `README.md`, `docs/PRD.md`, `docs/project_report.md`, and `render.yaml` are all present at the root or `docs/` folder.

---

### Field 2: Project Report Shareable Link
- [ ] **Source Document:** The generated comprehensive report is available at `docs/project_report.pdf` (and `docs/project_report.md`).
- [ ] **Google Drive Sharing Permissions:**
  1. Upload `docs/project_report.pdf` to your Google Drive.
  2. Right-click the uploaded file in Google Drive → click **Share** → **Share**.
  3. Under **General access**, change from **"Restricted"** to **"Anyone with the link"** (Role: **Viewer**).
  4. Click **Copy link**.
- [ ] **Verification in Private Window:** 
  - Open a brand-new Incognito/Private window.
  - Paste the copied Google Drive link.
  - Confirm the PDF opens and displays cleanly without prompting to "Sign in to Google Account".
- [ ] **Protocol:** URL strictly begins with `https://drive.google.com/...`.

---

### Field 3: Live Application URL
- [ ] **Protocol:** URL strictly begins with `https://` (SSL/TLS secured via Render / Vercel).
- [ ] **Host Configuration:**
  - [x] Backend listens on `process.env.PORT` and `0.0.0.0`.
  - [x] Single-origin unified deployment or strict CORS matching deployed frontend.
  - [x] Persistent database connected (MongoDB Atlas M0).
  - [x] Cloud image storage active (Cloudinary free tier with database fallback).
- [ ] **Health Endpoint Check:**
  - Visiting `https://<your-app>.onrender.com/health` returns HTTP 200 with `{"status":"ok","database":"connected"}`.
- [ ] **Private Window Verification:**
  - Open the live URL in an Incognito / Private window.
  - Test registration of a new test account.
  - Test login and check that JWT cookie is properly established.
  - Test browsing listings and viewing an item page.
  - Verify direct URL refresh does not produce a 404 (Single Page Application fallback verified).
- [ ] **Cold Start Notice:** Remember Render's free tier spins down after 15 minutes of inactivity. Open the live site 2 minutes before demonstrating or grading so the container is warm.

---

### Field 4: Feedback & Demo Video URL
- [ ] **Duration:** Video duration is between **3 and 5 minutes** (as required by evaluation guidelines).
- [ ] **Content Coverage:** Followed `docs/demo_script.md`:
  - [ ] Motivation & circular fashion problem statement.
  - [ ] Browse, search, and multi-filter demonstration.
  - [ ] Rule-based swap value comparison engine.
  - [ ] 2-phase barter state machine (request → accept → item auto-reservation → negotiation chat → completion).
  - [ ] Role-based Admin console (KPIs, moderation).
  - [ ] Personal learnings and full-stack challenges overcome.
- [ ] **Privacy & Access:**
  - Video is uploaded to YouTube (set to **Unlisted** or **Public**) or Loom (set to **Public**).
  - URL strictly begins with `https://`.
  - Link opens and plays without login in an Incognito/Private browser window.

---

## Summary of Completed Technical Requirements

- **Production Fixes (STEP 2):** Complete (Environment variables parameterized, CORS restricted, 0.0.0.0/PORT binding, Cloudinary cloud storage integrated, bcrypt password hashing, /health endpoint added, seed scripts configured).
- **Automated & Flow Testing (STEP 3):** Complete (100% tests passing, all 11 user journeys verified end-to-end).
- **Git & Repository Preparation (STEP 4):** Clean commit created, zero secrets tracked, push commands prepared.
- **Documentation (STEP 6):** Complete (`README.md`, `docs/PRD.md`, `docs/project_report.md`, `docs/project_report.pdf`, `docs/demo_script.md`, `docs/submission_checklist.md`).
