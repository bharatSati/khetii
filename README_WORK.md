# Kheti (खेती) - Development & Implementation Work Log

> **One app for a farmer's schemes, crop insurance, live mandi prices, marketplace, money records, documents and farming knowledge, in Hindi and English.**

This document provides a comprehensive report of the implementation of the **Kheti** platform, adhering strictly to the build specification in `README.md` and user directives.

---

## 1. Directory Structure & Constraints Compliance

As explicitly requested:
1. **Naming Convention:** Directories are named `frontend` and `backend`.
2. **Node Modules Constraint:** No `node_modules` directory exists in the root folder. All dependencies are strictly isolated inside `frontend/node_modules` and `backend/node_modules`.

```text
kheti/
├── backend/                  # Node.js + Express + Mongoose Backend
│   ├── config/
│   │   └── db.js             # Mongoose connection with in-memory fallback
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── schemeController.js
│   │   ├── insuranceController.js
│   │   ├── marketController.js
│   │   ├── marketplaceController.js
│   │   ├── financeController.js
│   │   ├── ocrController.js
│   │   ├── knowledgeController.js
│   │   └── searchController.js
│   ├── data/                 # Verified bilingual static content
│   │   ├── schemes.json      # PM-KISAN, PMFBY, KCC, Soil Health, PM-KUSUM, etc.
│   │   ├── insurance.json    # PMFBY rates, covered stages, 72h loss timeline
│   │   └── knowledge.json    # Agronomic guides, irrigation, IPM, dos & don'ts
│   ├── middleware/
│   │   ├── auth.js           # JWT verification & req.user scoping
│   │   ├── errorHandler.js   # Centralized JSON error handler
│   │   └── upload.js         # Multer memory storage (5MB max)
│   ├── models/
│   │   ├── User.js           # Plain-text password, language, crops, land size
│   │   ├── Transaction.js    # Personal finance ledger
│   │   ├── Listing.js        # Kheti farmer marketplace listings
│   │   └── OcrScan.js        # Document text scan history
│   ├── routes/               # Modular Express API routes
│   ├── services/
│   │   ├── marketService.js      # Agmarknet (data.gov.in) live client
│   │   ├── ocrService.js         # OCR.space API client (hin + eng)
│   │   └── marketplaceService.js # External listings adapter
│   ├── test-api.js           # Full end-to-end integration test suite
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/                 # React (Vite) Single Page Application (Neo-Brutalist Theme)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Neo-Brutalist topbar with brand, search & language/theme toggle
│   │   │   ├── Sidebar.jsx          # Neo-Brutalist navigation sidebar with offset active links
│   │   │   ├── MobileNav.jsx        # Mobile thumb bottom navigation & drawer
│   │   │   ├── ThemeToggle.jsx      # Neo-Brutalist Dark/Light theme mode switch button
│   │   │   ├── LanguageSwitcher.jsx # Instant Hindi/English switcher in sticker style
│   │   │   ├── GlobalSearch.jsx     # Grouped cross-module search with thick borders
│   │   │   ├── Modal.jsx            # Neo-Brutalist modal with yellow header and thick borders
│   │   │   ├── Loader.jsx           # Animated loading spinner in yellow block
│   │   │   └── EmptyState.jsx       # Actionable empty state card with dashed black borders
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Auth state, login/logout, language sync
│   │   │   └── ThemeContext.jsx     # Dark/Light theme state, localStorage sync, data-theme attribute
│   │   ├── i18n/
│   │   │   ├── index.js             # i18next configuration
│   │   │   └── locales/
│   │   │       ├── en.json          # English translations
│   │   │       └── hi.json          # Natural Devanagari Hindi translations
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Neo-Brutalist landing hero & feature showcase
│   │   │   ├── Login.jsx            # High-contrast login card (plain-text password)
│   │   │   ├── Register.jsx         # Farmer onboarding & profile setup
│   │   │   ├── Dashboard.jsx        # Personalized home with live data & sticker cards
│   │   │   ├── Schemes.jsx          # Searchable verified government schemes
│   │   │   ├── Insurance.jsx        # Interactive PMFBY guide & timeline
│   │   │   ├── Market.jsx           # Live mandi prices & comparison tool with visual bars
│   │   │   ├── Marketplace.jsx      # Farmer listings + External live tab
│   │   │   ├── Finance.jsx          # Personal farm ledger & analytics with progress bars
│   │   │   ├── Documents.jsx        # OCR upload, text extractor & helper
│   │   │   ├── Knowledge.jsx        # Practical agronomic guidance accordion
│   │   │   └── Profile.jsx          # Farmer profile, crops, and settings
│   │   ├── services/                # Axios API services layer
│   │   ├── styles/
│   │   │   ├── tokens.css           # Neo-Brutalist design tokens (black borders, hard shadows)
│   │   │   └── global.css           # Neo-Brutalism component classes & animations
│   │   ├── App.jsx                  # Route definitions & protected route guards
│   │   └── main.jsx                 # Application entrypoint
│   ├── index.html                   # Fonts (Noto Sans Devanagari, Plus Jakarta)
│   ├── vite.config.js               # Proxy to port 5000
│   └── package.json
│
├── .env.example
├── .gitignore
├── README.md                 # Original project specification
└── README_WORK.md            # Implementation Work Log (This file)
```

---

## 2. Implemented Features & Modules

### 2.1 Authentication & Profile
- **Registration (`POST /api/auth/register`):** Accepts name, email, password, preferred language (`en`/`hi`), state, district, land size (acres), and main crops.
- **Login (`POST /api/auth/login`):** Email + password comparison. Returns JWT token. Shows friendly message ("Email or password is incorrect") on failure.
- **Section 13 Compliance (DO NOT HASH):** Passwords are intentionally stored and matched as plain text in MongoDB. `bcrypt` or hashing algorithms are NOT used, complying strictly with project constraints.
- **Protected Routes:** Dashboard, Finance, Profile, and Listing creation require valid JWT authentication.
- **Profile Management (`GET/PUT /api/auth/me`):** Allows farmers to update language, district, state, land acreage, and crops. Language choice immediately syncs to `localStorage` and backend.

### 2.2 Farmer Dashboard
- **Greeting:** Displays personalized farmer greeting in chosen language inside a yellow neo-brutalist card.
- **Quick Actions:** One-tap shortcuts to Add Transaction, Check Mandi Prices, Browse Schemes, and Scan a Document with distinct background colors and hard offset shadows.
- **Finance Snapshot:** Shows this month's real income, expense, and net balance calculated from user records in MongoDB with high-contrast green, red, and yellow cards.
- **Market Glance:** Live mandi rates fetched for the farmer's saved main crops in their state. Shows prompt to configure crops if not yet specified.
- **Schemes for You:** Displays verified central/state schemes relevant to agricultural needs.
- **Insurance Protection:** Direct PMFBY card highlighting the 72-hour loss notification helpline (**14447**).
- **Recent Activity:** Real-time log of the user's latest ledger transactions and document OCR scans.

### 2.3 Government Schemes
- **Curated Real Schemes:** PM-KISAN, PMFBY, Kisan Credit Card (KCC), Soil Health Card, PM-KUSUM, PMKSY (Per Drop More Crop), e-NAM, Agriculture Infrastructure Fund (AIF), PM Kisan Maan-Dhan Yojana (PM-KMY).
- **Detail View:** Full details including objectives, eligibility criteria, subsidy amounts, required documents, application process, and official links.
- **Search & Filters:** Search by name/keyword and filter by category (Income Support, Insurance, Credit, Irrigation, Soil, Solar, Marketing, Infrastructure, Pension).
- **Compliance:** Verified against official government portals with official disclaimer notes.

### 2.4 PMFBY / Crop Insurance Guide
- **Bilingual Guide:** Dedicated page in plain language (`backend/data/insurance.json`).
- **Premium Rates Table:** Clear breakdown of farmer share (Kharif: 2.0%, Rabi: 1.5%, Commercial/Horticulture: 5.0%) and government subsidies in a neo-brutalist table with yellow header.
- **Covered Risks & Stages:** Prevented sowing, standing crop yield loss, localized calamities (hailstorm/cloudburst), and post-harvest drying losses.
- **Enrollment Steps:** 5-step clear process (Checking cut-off date, preparing documents, selecting channel: Portal, CSC, or Bank, paying farmer share, collecting receipt).
- **Loss Intimation Timeline:** Step-by-step breakdown emphasizing the **72-hour intimation deadline**, surveyor inspection within 48h, and direct DBT settlement.

### 2.5 Live Agricultural Market Intelligence (Mandi Prices)
- **data.gov.in / Agmarknet Integration:** Live mandi arrivals and wholesale price data.
- **Filters:** State, District, Market (Mandi), and Commodity with fast search.
- **Data Normalization:** `state, district, market, commodity, variety, arrivalDate, minPrice, maxPrice, modalPrice`.
- **Mandi Price Comparison View:** Compares modal prices across markets in a chosen state/district, highlighting the best modal price with visual Neo-Brutalist comparison bars.
- **Sorting:** By modal price (high-to-low / low-to-high) and market name.
- **Strict Rule Compliance:** **Market prices are NEVER persisted in MongoDB.** External data is fetched on-demand through Express with short in-memory cache to prevent rate-limiting. Official source attribution displayed on all queries.

### 2.6 Agricultural Marketplace
- **Separated Tabs:**
  1. **Farmer Listings (Kheti-owned, stored in MongoDB):** Logged-in farmers can create, edit, and delete their own produce, equipment, or seed listings (`title, category, price, unit, quantity, location, contactPhone, imageUrl`). Publicly browsable by all visitors.
  2. **External Sources (Live, never stored):** Live adapter behind `marketplaceService.js` configured via `MARKETPLACE_API_URL` and `MARKETPLACE_API_KEY`. If unconfigured, displays an honest, friendly message. Never fabricates fake items or saves external items in MongoDB.
- **Filters:** Full-text search, category selection, price range (min/max), and location filter.

### 2.7 Farmer Finance / Ledger
- **User Ledger:** Income and expense records scoped to the authenticated farmer (`type, amount, category, description, date`).
- **Categories:**
  - Income: Crop Sale, Subsidy/Scheme Payment, Equipment Rental Income, Dairy & Livestock, Other.
  - Expense: Seeds, Fertiliser, Pesticide, Labour, Irrigation, Equipment, Fuel, Loan Repayment, Transport, Other.
- **Summary Metrics:** Total income, total expense, net balance, and current month cash flow with 4 distinct bold cards.
- **Visual Analytics:** Category-wise percentage progress bars and monthly cash flow distribution across the current year.
- **Record Management:** Add, edit, filter, and delete entries.

### 2.8 Document & OCR Centre
- **File Upload:** Supports JPG, PNG, WEBP, and PDF up to 5 MB with validation.
- **OCR Engine:** Integration with OCR.space API (`OCR_API_KEY`) supporting both Hindi (`hin`) and English (`eng`).
- **Processing:** Processed in-memory via Multer buffer; **original files are discarded and never stored on disk**.
- **Results:** Extracted text display with **Copy to Clipboard** and **Download .txt** buttons.
- **Smart Helper:** Automatically extracts and highlights detected numerical values (dates, currency amounts, registration numbers) as Neo-Brutalist sticker chips.
- **Scan History:** Saves extracted text log to `OcrScan` in MongoDB for the farmer's recent activity reference.

### 2.9 Agricultural Knowledge Hub
- **Practical Guidance:** Categorized guides for Wheat, Paddy/Rice (Nursery & DSR), Soil Organic Carbon improvement, Drip Irrigation & Fertigation, Integrated Pest Management (IPM), and Scientific Grain Storage.
- **Actionable Structure:** Ideal timing, seed rates & seed treatment, recommended fertilizer doses, critical irrigation stages table, and explicit **Do's and Don'ts** in vivid green and red cards.

### 2.10 Global Search
- **Instant Search:** Header search bar querying `/api/search?q=` across Schemes, Knowledge Hub articles, and Kheti Farmer Listings.
- **Grouped Presentation:** Organizes results by module with direct navigation links.
- **Clean Separation:** Market prices and external marketplace searches stay within their own modules to avoid hitting external APIs unnecessarily.

### 2.11 Bilingual Support (Hindi + English)
- **Segmented Neo-Brutalist Toggle (`LanguageSwitcher.jsx`):**
  - Features an intuitive, side-by-side segmented toggle button (`[ 🇮🇳 हिंदी | English ]`).
  - Active language is prominently highlighted with a sunflower gold fill (`var(--nb-yellow)`), solid border, and drop shadow.
  - Inactive language is clean and clickable, eliminating all ambiguity about which language is active and which is next.
  - Reactively updates across renders via state management in `AuthContext` and event subscription on `i18n.on('languageChanged')`.
  - Dynamically updates `<html lang="hi">` and `<html lang="en">` attributes.
- **Full Application Internationalization:**
  - `Landing.jsx` is 100% translated (hero banner, features, stats, trust cards, badges).
  - Navigation headers, sidebars, helpline widgets, mobile drawers, empty states, and modal labels respond immediately to language toggle.
  - Curated data files (`schemes.json`, `insurance.json`, `knowledge.json`) feature complete bilingual content schemas.
- **Typography:** Configured with Google Fonts (`Noto Sans Devanagari` and `Plus Jakarta Sans`) ensuring clean, legible Devanagari and Latin typography.

### 2.12 Neo-Brutalism (Neubrutalism) Design System
The whole frontend has been designed in the **Neo-Brutalism UI theme**:
- **High-Contrast Solid Black Borders:** 2.5px to 3.5px solid true black (`#000000`) on all cards, buttons, modals, badges, inputs, and tables.
- **Hard Offset Drop Shadows:** Sharp, unblurred offset shadows (`2px 2px 0px #000`, `4px 4px 0px #000`, `6px 6px 0px #000`, `8px 8px 0px #000`).
- **Tactile Micro-Interactions:**
  - On hover: Components translate up/left (`transform: translate(-2px, -2px)`) while shadow expands (`box-shadow: 6px 6px 0px #000`).
  - On click / active: Components depress (`transform: translate(2px, 2px)`) with flattened shadow (`box-shadow: 1px 1px 0px #000`).
- **Agriculture-Adapted Color Palette:**
  - Sunflower / Marigold Gold: `#facc15`
  - Electric Agri Green: `#22c55e` / `#15803d`
  - Canal Sky Blue: `#38bdf8` / `#bae6fd`
  - Terracotta Clay: `#ea580c` / `#fed7aa`
  - Poppy Red: `#ef4444` / `#fecaca`
  - Background Canvas: Warm cream `#fbf9f1`
- **Chunky Typography & Stickers:** High-contrast 800/900 font weights, uppercase tags, sticker badges, and bold headers.

### 2.13 Dark Mode & Light Mode (Dual Neo-Brutalist Themes)
A comprehensive **Dark Mode and Light Mode** theme switching system has been implemented across the entire application:
- **Theme Architecture (`ThemeContext.jsx`):**
  - Provides `theme`, `toggleTheme`, and boolean `isDark`.
  - Persists preference in `localStorage.getItem('kheti_theme')`.
  - Supports automatic OS system preference detection (`window.matchMedia('(prefers-color-scheme: dark)')`).
  - Dynamically updates the root `data-theme="dark"` attribute on `<html>` / `document.documentElement`.
- **Theme Toggle Component (`ThemeToggle.jsx`):**
  - Integrated directly in the sticky top header next to the bilingual language switcher.
  - Neo-Brutalist tactile toggle button with Lucide `Sun` and `Moon` icons and clear "Light" / "Dark" text labels.
- **Neo-Brutalist Dark Mode Token Inversion (`tokens.css` & `global.css`):**
  - Canvas switches to midnight obsidian (`#0e0f12`) and card surfaces to deep slate (`#1a1c23`).
  - Borders invert to crisp, bold white (`#ffffff` solid 2.5px–3.5px).
  - Hard offset drop shadows invert to pure white offsets (`2px 2px 0px #fff`, `4px 4px 0px #fff`, `6px 6px 0px #fff`).
  - Text colors switch to high-contrast white (`#ffffff`) and soft grey (`#e5e7eb`).
  - Buttons and badges with neon fills (`.btn-primary`, `.btn-gold`, `badge-gold`, table headers) enforce deep black text (`#000000 !important`) for maximum WCAG contrast and readability in dark mode.

### 2.14 Farmer Hero Video (Full Length & Width Edge-to-Edge Showcase)
- **Full Length & Width Video Background:**
  - Embedded `frontend/src/assets/videos/farmer.mp4` across the **entire viewport width (100% edge-to-edge)** and **full length** (`minHeight: calc(100vh - var(--header-height))`).
  - Container updated in `App.jsx` (`landing-page-container`) and `global.css` (`.hero-fullscreen-section`) allowing full-bleed presentation without horizontal restriction.
- **Continuous Looping Playback:**
  - Configured with `autoPlay`, `loop`, `muted`, and `playsInline` attributes for seamless cross-browser autoplay.
  - Removed pause and sound toggle buttons as requested for an uninterrupted, distraction-free visual experience.
- **Unboxed, High-Contrast Typography & Colorful Stickers:**
  - **White Card Box Removed:** The central white box container has been removed, letting the farmer video breathe and cover the entire background.
  - **Ultra-High Visibility Typography:**
    - Main Headline (H1): Pure crisp white (`#ffffff`) with deep multi-layered drop shadows (`0 4px 20px rgba(0,0,0,0.98)`).
    - Subtitle: Warm golden cream (`#fef08a`) with high-contrast text shadow.
    - Top Live Status: Sunflower yellow pill (`#facc15`) with pulsating red live dot.
    - Badges & Buttons: Electric Agri Green (`#22c55e`) and Sunflower Gold (`#facc15`) with solid 3.5px black borders and 6px drop shadows.
    - Checkpoint Chips: Solid Forest Green, Golden Mustard, Sky Blue, and White chips directly overlaid over the video.
- **Rest of UI Updated for Farmer Context:**
  - **Farmer Impact Stat Strip:** 3 bold cards highlighting PM-KISAN (₹6,000/yr), PMFBY claim window (72h), and real-time mandi prices.
  - **Farmer Voice / Story Spotlight:** Authentic progressive farmer testimonial highlighting direct benefits.
  - Both English and Hindi fully synchronized across video badges, impact statistics, and quotes.

---

## 3. Automated Integration Test Results

A full test suite in `backend/test-api.js` was executed against the running backend server:

```text
--- STARTING KHETI API INTEGRATION TESTS ---
1. Testing /health...
   Status: ok
2. Testing /auth/register...
   Registered user: Ramesh Patel | Token received: true
3. Testing /auth/login with plain text password...
   Login success: farmer_1791112988748@example.com
4. Testing /auth/me (PUT)...
   Updated district: Muzaffarnagar
5. Testing /schemes...
   Total schemes available: 9
6. Testing /insurance...
   Insurance title: प्रधानमंत्री फसल बीमा योजना (पीएमएफबीवाई) मार्गदर्शिका
7. Testing /market/filters...
   States supported: 16 | Commodities: 17
8. Testing /finance/transactions (POST)...
   Created transaction 1: Crop Sale ₹45000
   Created transaction 2: Fertiliser ₹8500
9. Testing /finance/summary...
   Summary: Income ₹45000 | Expense ₹8500 | Net ₹36500
10. Testing /marketplace/listings (POST)...
   Created listing: Sharbati Wheat Seeds (Certified) ₹3200
11. Testing /marketplace/listings (GET)...
   Farmer listings found: 1
12. Testing /knowledge...
   Knowledge articles: 6
13. Testing /search?q=wheat...
   Search results for "wheat": Schemes: 0 | Knowledge: 1 | Listings: 1

✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅
```

Frontend production build verification (`npm run build` in `/frontend`):
```text
vite v5.4.21 building for production...
✓ 1678 modules transformed.
dist/index.html                       1.00 kB │ gzip:   0.58 kB
dist/assets/farmer-ghjTstkb.mp4  12,779.35 kB
dist/assets/index-BGRBsJ1r.css       13.80 kB │ gzip:   3.18 kB
dist/assets/index-CZpFawqq.js       453.61 kB │ gzip: 129.72 kB
✓ built in 7.14s
```

---

## 4. Setup & Running Instructions

### 4.1 Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (Local daemon, MongoDB Atlas, or automatic in-memory fallback)

### 4.2 Start Backend
```bash
cd backend
# Fill in API keys in backend/.env if available (MARKET_API_KEY, OCR_API_KEY)
npm run dev
# Server will listen on http://localhost:5000
```

### 4.3 Start Frontend
```bash
cd frontend
npm run dev
# Application will run on http://localhost:5173
```

---

## 5. Summary of Constraints Respected
- **Neo-Brutalism UI Theme:** Complete frontend styled with authentic Neo-Brutalism design language (solid thick borders, unblurred hard offset shadows, high-contrast badges, tactile active states).
- **Dark Mode & Light Mode:** Seamless dual-theme switching with system detection, localStorage persistence, obsidian/white token inversions, and high-contrast accessibility.
- **Plain-text passwords:** Strictly adhered to Section 13 (no bcrypt/hash).
- **No external data in MongoDB:** Market prices and external listings are never stored in MongoDB.
- **Folder naming convention:** `frontend` and `backend` used.
- **Root folder clean:** Root folder contains 0 node_modules.
- **Accurate data:** Government schemes, PMFBY rates, and knowledge guides derived from verified official sources.
- **Sidebar Restored & Sticky Layout:** The desktop `<Sidebar />` remains in its proper place on all service pages (`/schemes`, `/market`, etc.) with `position: sticky; top: var(--header-height)` so it stays cleanly docked without awkward jumping during page scrolling.
- **Side Scrollbar Completely Hidden:** Configured universal scrollbar suppression (`::-webkit-scrollbar { display: none !important }`, `scrollbar-width: none !important`, `-ms-overflow-style: none !important`) across all elements and browsers. When scrolling anywhere, no visible scrollbar track or thumb appears on the side, keeping full smooth scrollability.
- **Card Click & Modal Background Fade Effect:** Clicking any box or card applies tactile feedback and triggers a smooth cinematic backdrop fade (`modalBackdropFade` with soft dark tint and `blur(6px)`), with subtle sibling dimming on grid interactions.
- **Strict Zero-Storage for Mandi Prices:** Strictly enforced zero storage for mandi market prices across both MongoDB and filesystem (no fallback files). The application queries `data.gov.in` live in real-time.
- **Informative Live Mandi Outage Notice:** When the official government API (`data.gov.in`) experiences server downtime, proxy timeouts, or HTTP 500 issues, the backend catches the error and the frontend gracefully displays an informative Neo-Brutalist notice explaining the upstream status (`"The live Government Agmarknet API (data.gov.in) is currently unavailable due to upstream server issues. Please try again in a few moments."`) with an interactive Retry button and official portal reference.
- **Interactive Geolocation Recording at Signup (GPS Tracing):**
  - Replaced manual state/district text entry on `Register.jsx` with an interactive GPS location permission prompt (`navigator.geolocation.getCurrentPosition`).
  - Automatically reverse-geocodes coordinates into user's City, District, and State via OpenStreetMap Nominatim.
  - If the user declines, dismisses, or encounters a location permission issue, the system automatically falls back to **Delhi** (`lat: 28.6139, lon: 77.2090, city: "Delhi", district: "New Delhi", state: "Delhi"`) ensuring seamless registration without blocking.
- **Live Agricultural Weather API & Dashboard Widget:**
  - Integrated Open-Meteo live meteorological forecast API (`https://api.open-meteo.com/v1/forecast`) on `/api/weather`.
  - Zero API key required, with 10-minute in-memory caching to eliminate redundant upstream calls.
  - Generates real-time agro-meteorological advisories in both Hindi and English tailored to the current weather condition (irrigation, spraying, harvesting, thunderstorm safety).
  - Neo-Brutalist **Live Farm Weather Card** on `Dashboard.jsx`: Displays live temperature (°C), feels-like temp, humidity (%), wind speed (km/h), rain risk (%), bilingual agricultural advisory banner, GPS-verified / Delhi default status badge, and a 3-day forecast strip.
- **Local Samvaad (स्थानीय संवाद - 5 km Radius Hyperlocal Community & Chat):**
  - **Geospatial 5 km Querying:** Uses MongoDB 2dsphere indexing and `$geoWithin` spherical coordinates with Haversine distance calculation to fetch posts within a 5 km radius of the farmer's registered GPS coordinates (or Delhi default).
  - **Interactive Discussion:** Farmers can publish discussion posts (categorized by Crops, Equipment sharing, Weather alert, Pest control, General advice), toggle likes, write threaded comments/replies (acting as a community chat for each issue), and share posts with link-copy and Web Share API support.
  - **Proximity Badging:** Every post dynamically displays its precise distance (e.g. `📍 1.5 किमी दूर`), author location, category pill, and active like/comment counters.
  - **Quick Access:** Direct links available from the main Desktop Sidebar, Mobile Bottom Navigation drawer, and Dashboard Quick Actions.
  - **Refined Discussion Post Form & Cloudinary Image Upload:**
    - Cleaned up form layout with comfortable margins, padding (`24px 28px`), `maxHeight: 88vh`, and custom scroll handling.
    - Integrated Cloudinary stream upload service (`backend/services/cloudinaryService.js`) reading `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from `backend/.env`.
    - Interactive dashed image dropzone with live preview, thumbnail, file size badge, and remove button.
    - Graceful fallback to Data URI when Cloudinary credentials are not yet configured in `.env`.
    - Embedded image display within community post cards with high-contrast borders and responsive aspect ratios.
- **Fixed Desktop Sidebar Navbar:**
  - Configured `<Sidebar />` with `position: fixed; top: var(--header-height); left: 0; bottom: 0; z-index: 800`.
  - Main wrapper receives `margin-left: var(--sidebar-width)` on desktop via `.main-content-layout.with-sidebar`, with automatic `margin-left: 0` on mobile viewports (`<= 768px`).
  - When scrolling down any page (Mandi, Schemes, Community Samvaad, etc.), the sidebar remains firmly fixed in view without scrolling away.
- **Fixed Top Header Navbar:**
  - Configured `<Header />` with `position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 1000`.
  - Added `padding-top: var(--header-height)` to `.app-container` so page content starts cleanly below the header with zero overlap or layout breaks across all desktop, tablet, and mobile viewports.




