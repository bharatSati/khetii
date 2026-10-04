# Kheti

> One app for a farmer's schemes, crop insurance, live mandi prices, marketplace, money records, documents and farming knowledge, in Hindi and English.

**This README is the build specification for Kheti.** It is written for an AI coding agent (Google Antigravity) to read and build the complete application without guessing what the product should do. Build real, working functionality. Do not build pages that only look complete.

---

## 1. Project Overview

Kheti is an agriculture-focused web platform that brings important agricultural services into one coherent application. A farmer logs in, lands on a dashboard, and moves between modules (schemes, insurance, market prices, marketplace, finance, OCR, knowledge) without feeling like they are using separate apps.

Stack: **MERN** (MongoDB, Express, React, Node). Hackathon-scale. Keep it simple.

## 2. Problem Statement

Farmers have to visit many disconnected websites and apps to find government schemes, crop insurance details, current mandi prices, products, farming knowledge, financial records and document help. This **fragmentation of agricultural information and tools** creates friction, and it is worst for users with limited time, limited digital literacy, and a preference for Hindi.

## 3. Proposed Solution

```text
Government Schemes + Crop Insurance + Live Market Info + Marketplace
        + Finance Ledger + Documents/OCR + Knowledge Centre
                              ↓
                           KHETI
```

A single, simple, responsive, bilingual interface with one login and one design language.

## 4. Target Users

- Small and marginal farmers, who need simple language, large tap targets, Hindi by default if chosen, and mobile-first screens.
- Farmer family members or helpers who manage records and paperwork.
- Anyone exploring agricultural schemes or mandi prices.

---

## 5. Complete Feature List

| # | Module | Short description |
|---|--------|-------------------|
| 1 | Auth | Register, login, logout |
| 2 | Dashboard | Personalised home with quick access to everything |
| 3 | Government Schemes | Browsable, searchable, filterable scheme cards |
| 4 | PMFBY / Crop Insurance | Farmer-friendly PMFBY guide |
| 5 | Market Intelligence | Live mandi prices from an external API |
| 6 | Marketplace | Live external listings + Kheti-owned farmer listings |
| 7 | Finance / Ledger | Income and expense tracking with summary |
| 8 | Document / OCR Centre | Upload image or document, extract text |
| 9 | Knowledge Centre | Categorised practical farming guidance |
| 10 | Search | Global search across static content, plus module-level search |
| 11 | Hindi + English | Visible language switcher, preference saved to the user |

---

## 6. Detailed Feature Behaviour

### 6.1 Authentication
- **Register:** name, email (used as username), password, preferred language (`en`/`hi`). Optional profile fields: state, district, land size (acres), main crops.
- **Login:** email + password. On success the backend returns a JWT; the frontend stores it and sends it as `Authorization: Bearer <token>`.
- **Logout:** clears the token and returns to the landing/login page.
- Protected routes (dashboard, finance, OCR, profile, creating listings) require login. Schemes, insurance, knowledge and market browsing may be public. Decide sensibly and keep it consistent.
- Invalid login shows a clear message ("Email or password is incorrect"), not a raw error.
- **Passwords are stored and compared as plain text. See section 13.**

### 6.2 Farmer Dashboard
The first screen after login. It must be useful, not decorative.

Sections (use real data only):
- **Greeting** with the farmer's name and a language toggle.
- **Quick actions:** Add transaction, Check mandi price, Browse schemes, Scan a document.
- **Finance snapshot:** this month's income, expense and net, from the user's real transactions. If there are none, show an empty state with an "Add your first entry" button.
- **Market glance:** prices for the user's saved main crops/state, fetched live. If the user has not set crops, show a prompt to choose them in Profile.
- **Schemes for you:** a few scheme cards from the schemes data, filtered by the user's state or crops where possible.
- **Insurance card:** short PMFBY summary with a link to the Insurance page.
- **Recent activity:** last few transactions or OCR scans (real data only).

Do not show fake statistics, fake charts or placeholder numbers.

### 6.3 Government Schemes
- Page with a card grid, a **search box**, **category filters** (e.g. Income Support, Insurance, Credit/Loan, Irrigation, Soil & Inputs, Marketing, Pension) and a "state/central" filter if data supports it.
- Each scheme has a detail view (modal or page) with: **name, description, eligibility, benefits, important requirements/documents, how to apply, official link(s)**.
- **Data source:** curated static content in `server/data/schemes.json` (bilingual fields `{ "en": "...", "hi": "..." }`), served by `/api/schemes`. This is Kheti-owned reference content, not external marketplace data.
- **Accuracy rule:** only include real schemes, and verify each against official sources (e.g. pmkisan.gov.in, pmfby.gov.in, myscheme.gov.in, agricoop.gov.in, enam.gov.in). Suggested starting set: PM-KISAN, PMFBY, Kisan Credit Card (KCC), Soil Health Card, PM-KUSUM, PMKSY (irrigation), Agriculture Infrastructure Fund, e-NAM, PM Kisan Maan-Dhan Yojana. **Do not invent schemes, amounts or eligibility rules.** If a detail cannot be verified, omit it and link to the official page instead.
- Every scheme must have at least one official link. Show a note: "Check the official website for the latest rules."

### 6.4 PMFBY / Crop Insurance
A dedicated page, in plain language, structured as short sections:
- What PMFBY is
- Who is eligible
- What is covered (risks and stages)
- Premium information (the farmer's share by season/crop type: Kharif, Rabi, commercial/horticulture) as published officially
- Crops and seasons
- Important conditions and deadlines (e.g. notifying loss within the official time window)
- How to enrol (bank, CSC, insurance portal) and how to claim
- Official links (pmfby.gov.in and related)

Implementation: static bilingual content in `server/data/insurance.json` served by `/api/insurance`, rendered with accordions/steps. Add a simple "Steps to enrol" and "What to do after crop loss" timeline. Verify all figures against official PMFBY sources. Do not make this a generic insurance site.

### 6.5 Live Agricultural Market Intelligence
Shows current commodity prices from mandis.

- **External source:** Agmarknet data via the **data.gov.in open API** ("Current daily price of various commodities from various markets (Mandi)"). The API key goes in `MARKET_API_KEY`. Base URL and resource ID go in env (`MARKET_API_URL`, `MARKET_RESOURCE_ID`). Check the data.gov.in docs for the current resource ID and field names (typically state, district, market, commodity, variety, arrival date, min/max/modal price per quintal).
- **UI:** filters for State, District, Market (mandi), Commodity; search by crop name; a results table (cards on mobile) with min, max, modal price, variety and date; sorting by price; **price comparison** view (same commodity across mandis in a chosen state or district, highlighting the best modal price); optionally a simple bar chart for comparison.
- **Flow (strict):**
  1. Frontend calls `GET /api/market?state=&district=&market=&commodity=&limit=`.
  2. Backend calls the external API using the server-side key, normalises fields, handles pagination limits.
  3. Backend returns clean JSON.
  4. Frontend renders it.
- **Never store market data in MongoDB.** No market collection, no sync job, no cache collection. (A tiny in-memory per-request cache of a minute or two in Express is acceptable but not required.)
- Show "Fetching latest market data..." while loading, a friendly empty state for no results, and a clear error if the API or key is unavailable. Show the data's date and attribute the source.

### 6.6 Marketplace
Browse, search and filter agricultural products and services (seeds, fertilisers, tools, produce, equipment).

Two clearly separated tabs:

1. **Farmer Listings (Kheti-owned, stored in MongoDB).** Logged-in users can create, edit and delete their own listings (title, category, description, price, unit, quantity, location, contact phone, optional image URL). Anyone can browse. This is genuinely Kheti-owned data, so it persists in a `Listing` collection.
2. **External Sources (live, never stored).** Listings fetched live through the backend from a configured external provider via `GET /api/marketplace/external?q=&category=`.
   - Implement this behind a single adapter file `server/services/marketplaceService.js` configured by `MARKETPLACE_API_URL` and `MARKETPLACE_API_KEY`.
   - If no external provider is configured, show a friendly "External marketplace source is not configured" message. **Do not fabricate listings and do not fall back to hard-coded fake products.**
   - Each external result links out to its source (open in a new tab).
   - **Do not write external listings to MongoDB under any circumstances.**

Search (text), category filter, price range and location filter apply to both tabs. Responsive card grid. Empty states for no results.

### 6.7 Farmer Finance / Ledger
A simple personal ledger. Not an accounting app.

- Add a transaction: **type** (income/expense), **amount**, **category**, **description**, **date**.
- Categories (suggested): Income: Crop Sale, Subsidy/Scheme Payment, Other. Expense: Seeds, Fertiliser, Pesticide, Labour, Irrigation, Equipment, Fuel, Loan Repayment, Other.
- Transaction history table/list with filters (type, category, date range), edit and delete.
- Summary: total income, total expense, net balance, per-category breakdown, and monthly totals (simple chart is fine).
- All records belong to the logged-in user and are stored in MongoDB. A user can only access their own records.

### 6.8 Document / OCR Centre
- User uploads an image (JPG, PNG) or PDF, with a size limit (e.g. 5 MB) and clear validation messages.
- Frontend sends the file to `POST /api/ocr` (multipart). The backend sends it to the OCR service and returns the extracted text.
- **OCR service:** use the **OCR.space API** (`OCR_API_KEY`), which supports Hindi (`hin`) and English (`eng`). The language option follows the user's selection. Keep the key server-side only.
- Show the extracted text in a readable panel with **Copy** and **Download .txt** buttons, and a preview of the uploaded file.
- Only claim what OCR can really do: text extraction. Do not promise automatic field parsing of Aadhaar, land records, etc., unless it is actually implemented and reliable. A simple optional helper (e.g. highlight numbers and dates) is fine.
- Uploaded files are processed and discarded. Do not store the files. Optionally store a small scan history (file name, date, extracted text) in MongoDB for "Recent activity".
- If the key is missing or OCR fails, show a clear error.

### 6.9 Agricultural Knowledge Centre
- Categorised, searchable practical guidance. Suggested categories: Crop Guides (wheat, rice, sugarcane, maize, mustard, potato, vegetables), Soil & Fertiliser, Irrigation & Water, Pest & Disease Management, Seasonal Calendar (Kharif/Rabi/Zaid), Organic & Sustainable Farming, Post-Harvest & Storage.
- Each entry has a title, category, short summary and structured practical content (steps, dos and don'ts, timings). Content must be accurate, concise and useful. No filler articles.
- Stored as bilingual static content in `server/data/knowledge.json` served by `/api/knowledge`, with category filter and search. If a topic cannot be covered accurately, leave it out.

### 6.10 Search
- A global search bar in the header searches **schemes, knowledge articles, crop names and Kheti farmer listings**, grouped by type in the results (`GET /api/search?q=`). Results link to the relevant page.
- Live market and external marketplace data are searched inside their own modules (their own search boxes), not in global search, to avoid hitting external APIs on every keystroke.
- Simple case-insensitive matching is enough. No search engine infrastructure.

### 6.11 Hindi + English
- Use `react-i18next` (or an equivalent light approach) with `en.json` and `hi.json` UI translation files.
- A visible language selector sits in the header on every page. The choice is applied immediately, remembered in `localStorage`, and saved to the user's profile when logged in.
- Static content (schemes, insurance, knowledge) uses bilingual fields and switches language.
- Live external data (mandi names, commodity names, third-party listings) is shown as returned by the source. Do not attempt dynamic machine translation. Labels, buttons, filters, headings and messages around that data are translated.
- Use a font that renders Devanagari well (e.g. Noto Sans Devanagari).

---

## 7. User Flow

```text
Landing → Register / Login → Dashboard
   ├── Schemes → search/filter → scheme detail → official link
   ├── Insurance → read guide → official link
   ├── Market → choose state/commodity → live prices → compare mandis
   ├── Marketplace → Farmer Listings (create/browse) | External (live)
   ├── Finance → add transaction → history → summary
   ├── Documents → upload → OCR → copy/download text
   ├── Knowledge → category → article
   └── Profile/Settings → language, state, district, crops, logout
```

First-time users are guided to complete their profile (state, district, main crops) so that the dashboard and market glance become personalised. This step can be skipped.

---

## 8. UI / UX Requirements

- **Modern, distinctive, agriculture-themed identity.** Not a generic Bootstrap dashboard. Suggested direction: warm earthy palette (deep leaf green, soil brown, wheat/turmeric yellow, off-white background), rounded cards, bold readable headings, subtle crop/field-inspired motifs or illustrations. Pick one design system and use it everywhere (shared colour tokens, type scale, spacing, buttons, cards, form fields, tables, badges, empty states) via CSS variables.
- Plain CSS (or CSS modules). No heavy UI frameworks required. A small icon library is fine.
- Priorities: readability, large touch targets, strong hierarchy, clear navigation, good spacing, consistent components.
- **Navigation:** desktop sidebar or top bar; mobile bottom tab bar or hamburger drawer. Items: Dashboard, Schemes, Insurance, Market, Marketplace, Finance, Documents, Knowledge, Profile. Language selector and global search always reachable.
- **Responsive:** fully usable on desktop, tablet and mobile. Tables become stacked cards on small screens. Forms are single-column on mobile.
- **Loading states** for every external call, for example "Fetching latest market data...". Use skeletons or spinners. The UI must never look frozen.
- **Empty states and errors** are friendly and actionable.

---

## 9. MERN Architecture

```text
React (Vite or CRA)  →  Express/Node API  →  MongoDB (Mongoose)
                                  ↓
                     External APIs (market, OCR, marketplace)
```

- The frontend talks only to the Express backend (via an axios/fetch service layer in `client/src/services`). The frontend never calls external APIs that need keys.
- The backend owns all secrets and all external API calls.
- Use CORS configured for the frontend origin. Use `multer` for uploads (memory storage), `jsonwebtoken` for tokens, `dotenv`, `mongoose`, `axios`, `cors`.
- No microservices, Redis, queues, Kubernetes, or similar.

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me` | Auth and profile |
| `GET /api/schemes`, `GET /api/schemes/:id` | Static scheme content |
| `GET /api/insurance` | Static PMFBY content |
| `GET /api/market` (+ `/api/market/filters` for state/commodity options if available) | **Live** mandi prices |
| `GET /api/marketplace/listings`, `POST`, `PUT /:id`, `DELETE /:id` | Kheti-owned listings (MongoDB) |
| `GET /api/marketplace/external` | **Live** external listings |
| `GET/POST/PUT/DELETE /api/finance/transactions`, `GET /api/finance/summary` | User ledger |
| `POST /api/ocr` | OCR processing |
| `GET /api/knowledge`, `GET /api/knowledge/:id` | Static knowledge content |
| `GET /api/search?q=` | Global search |

---

## 10. MongoDB Requirements

MongoDB stores **only Kheti-owned data**:

```text
User
- name
- email (unique)
- password (plain text, see section 13)
- language ('en' | 'hi')
- state, district, landSizeAcres, mainCrops[]
- createdAt

Transaction
- user (ref User)
- type ('income' | 'expense')
- amount
- category
- description
- date
- createdAt

Listing  (Kheti farmer listings only)
- user (ref User)
- title, category, description
- price, unit, quantity
- location, contactPhone, imageUrl
- createdAt

OcrScan  (optional, for recent activity)
- user (ref User)
- fileName
- extractedText
- createdAt
```

Create other models only if a feature genuinely needs them.

**Strict rule: never create a MongoDB copy of external marketplace listings, external market prices, or external product data.**

Static reference content (schemes, insurance, knowledge) lives in JSON files in `server/data/`, not in the database, unless you choose to seed it. Keep it simple.

---

## 11. Live API Requirements

| Need | Service | Where the key lives |
|------|---------|---------------------|
| Mandi prices | data.gov.in Agmarknet commodity price API | `MARKET_API_KEY` (server) |
| OCR | OCR.space API | `OCR_API_KEY` (server) |
| External marketplace listings | Provider configured via adapter | `MARKETPLACE_API_KEY` (server) |

```text
Live external data  →  fetched through Express when requested  →  never persisted
Kheti-owned data    →  stored in MongoDB
```

Backend services in `server/services/` (`marketService.js`, `ocrService.js`, `marketplaceService.js`) wrap each external call, normalise responses, set timeouts, and throw friendly errors that controllers translate to clear JSON messages (`{ "message": "..." }`).

---

## 12. Authentication Requirements

- Register / Login / Logout as described in 6.1.
- JWT in the `Authorization` header, verified by an `auth` middleware on protected routes.
- User-owned data (transactions, listings, scans) is always filtered by the authenticated user's id. A user can only edit or delete their own records.
- Keep it basic. No OAuth, no email verification, no refresh-token systems, no role management.

---

## 13. Password Requirement: DO NOT HASH

**For this project, passwords must NOT be hashed.**

- Do **not** install or use `bcrypt`, `bcryptjs`, `argon2`, `crypto` hashing, or any salting/hashing step.
- Store the password exactly as the user entered it in the `User.password` field.
- Login compares the submitted password directly with the stored value.
- Never return the password field in API responses.

This is an explicit project requirement. Follow it as written, and do not add password-hashing "improvements".

---

## 14. Environment Variables

All secrets live in `server/.env` (and a `.env.example` with placeholders is committed). Never hard-code keys and never expose secrets in frontend code.

```env
# Server
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kheti
JWT_SECRET=change_me
CLIENT_URL=http://localhost:5173

# Market data (data.gov.in)
MARKET_API_KEY=
MARKET_API_URL=https://api.data.gov.in/resource
MARKET_RESOURCE_ID=

# OCR (OCR.space)
OCR_API_KEY=
OCR_API_URL=https://api.ocr.space/parse/image

# External marketplace provider (optional)
MARKETPLACE_API_URL=
MARKETPLACE_API_KEY=
```

The only frontend variable allowed is the non-secret backend URL, e.g. `VITE_API_URL=http://localhost:5000/api`.

If a required key is missing, the related module shows a clear "service not configured" message instead of crashing.

---

## 15. API Integration Requirements

- All external calls go through Express services with a timeout (e.g. 10 to 15 seconds) and try/catch.
- Normalise external responses into a stable shape for the frontend (for market: `state, district, market, commodity, variety, arrivalDate, minPrice, maxPrice, modalPrice`).
- Support query filters server-side where the external API allows; otherwise filter in the backend before responding.
- Map failures to friendly messages: API unavailable, rate limited, missing key, empty result, network failure, OCR failed.
- Frontend `services/` files wrap every call, attach the token, and expose loading and error states through hooks (e.g. `useFetch`).

---

## 16. Project Structure

```text
Kheti/
├── client/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, Card, Table, Loader, EmptyState, LanguageSwitcher...
│   │   ├── pages/           # Landing, Login, Register, Dashboard, Schemes, Insurance,
│   │   │                    # Market, Marketplace, Finance, Documents, Knowledge, Profile
│   │   ├── services/        # api.js, authService, marketService, financeService, ocrService...
│   │   ├── hooks/           # useAuth, useFetch, ...
│   │   ├── context/         # AuthContext
│   │   ├── i18n/            # en.json, hi.json, setup
│   │   ├── styles/          # tokens.css (design variables), global.css
│   │   └── App.jsx, main.jsx
│   └── package.json
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/              # User, Transaction, Listing, OcrScan
│   ├── services/            # marketService, ocrService, marketplaceService
│   ├── middleware/          # auth, error handler, upload
│   ├── data/                # schemes.json, insurance.json, knowledge.json
│   ├── server.js
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

Adjust as needed, but keep frontend and backend responsibilities cleanly separated.

---

## 17. Local Setup

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas), API keys for data.gov.in and OCR.space.

```bash
# 1. Clone
git clone <repository-url>
cd Kheti

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment
cd ../server
cp ../.env.example .env      # then fill in MONGODB_URI, JWT_SECRET, MARKET_API_KEY, OCR_API_KEY, etc.

# 4. Start backend (from /server)
npm run dev                  # nodemon server.js, runs on PORT (default 5000)

# 5. Start frontend (from /client, in a second terminal)
npm run dev                  # runs on http://localhost:5173
```

Both `package.json` files must define the `dev` script (and `start` for the server).

---

## 18. Implementation Principles

1. **Build actual functionality.** Every button and form must do its job.
2. **Use real data.** Real APIs and real database operations. No hard-coded fake dynamic data.
3. **Live external data stays live.** Market prices and external marketplace listings are fetched on request and never made the responsibility of MongoDB.
4. **MongoDB for Kheti-owned data.** Users, transactions, farmer listings, scan history.
5. **Keys stay in the backend.** All secrets in `.env`.
6. **Keep it coherent.** One design language, one navigation, one auth, one language switcher.
7. **Accuracy over volume.** Schemes, insurance and knowledge content must be real and verified. Omit rather than invent.
8. **Avoid unnecessary complexity.** Clean and understandable beats enterprise-grade.

---

## 19. Important Constraints

- **Do NOT store external marketplace listings, market prices or product data in MongoDB.**
- **Do NOT hash passwords** (no bcrypt, Argon2, salting).
- **Do NOT expose API keys** in frontend code or commit real `.env` files.
- **Do NOT invent** government schemes, benefits, premiums or eligibility rules.
- **Do NOT fabricate** marketplace or market results when an external source is unavailable. Show an honest message instead.
- **Do NOT add** microservices, Kubernetes, Redis, blockchain, recommendation engines, advanced analytics or other unneeded technology.
- The app must be **responsive**, **bilingual (English/Hindi)**, and show **loading and error states** for every external call.