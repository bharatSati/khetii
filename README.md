# 🌾 Khetii (खेती) — Digital Farmer Companion

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.6-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.0-black.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Llama%203.3%2070B-FF6F00.svg)](https://groq.com/)
[![Design](https://img.shields.io/badge/Design-Neo--Brutalist-FACC15.svg)](#neo-brutalist-design-system)
[![Languages](https://img.shields.io/badge/Languages-Hindi%20%7C%20English-22C55E.svg)](#multilingual-i18n--voice-support)

> **"Useful digital tools for farmers — all in one place."**  
> **"किसानों के लिए व्यावहारिक डिजिटल सेवाएं और कृषि सलाह — एक ही स्थान पर।"**

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Highlights & Differentiators](#-key-highlights--differentiators)
3. [Core Feature Modules](#-core-feature-modules)
   - [1. Farm Overview & Dashboard](#1--farm-overview--dashboard)
   - [2. Farm Weather Intelligence & Spray Advisor](#2--farm-weather-intelligence--spray-advisor)
   - [3. Government Schemes & Groq Voice AI](#3--government-schemes--groq-voice-ai)
   - [4. PMFBY Crop Insurance & 72-Hour Claim Guide](#4--pmfby-crop-insurance--72-hour-claim-guide)
   - [5. Live Mandi Wholesale Prices (Agmarknet)](#5--live-mandi-wholesale-prices-agmarknet)
   - [6. Farmer Marketplace (Kisan Haat)](#6--farmer-marketplace-kisan-haat)
   - [7. Farmer Digital Services (Hero Image AI & Document Tools)](#7--farmer-digital-services)
   - [8. Khata Bahi (Farmer Finance & Profit Ledger)](#8--khata-bahi-farmer-finance--profit-ledger)
   - [9. Agriculture Knowledge Hub & 1.7L+ KCC Records](#9--agriculture-knowledge-hub--17l-kcc-records)
   - [10. Local Kisan Samvaad (Community Forum)](#10--local-kisan-samvaad-community-forum)
4. [System Architecture & Data Flow](#-system-architecture--data-flow)
5. [Neo-Brutalist Design System & Mobile UX](#-neo-brutalist-design-system--mobile-ux)
6. [Tech Stack](#-tech-stack)
7. [Repository Structure](#-repository-structure)
8. [Environment Variables](#-environment-variables)
9. [Step-by-Step Installation & Local Setup](#-step-by-step-installation--local-setup)
10. [API Reference & Endpoints](#-api-reference--endpoints)
11. [Agricultural Safety & Responsible AI](#-agricultural-safety--responsible-ai)
12. [Production Build & Deployment](#-production-build--deployment)
13. [Contributing & License](#-contributing--license)

---

## 🌟 Project Overview

**Khetii (खेती)** is a comprehensive, production-ready digital agriculture platform crafted specifically for Indian farmers. Combining real-time government datasets, cutting-edge artificial intelligence (Google Gemini Vision and Groq Llama 3.3), and lightweight client-side utility engines, Khetii removes technological barriers in Indian agriculture.

Designed with a high-contrast **Neo-Brutalist UI**, complete bilingual localization (**Hindi & English**), and audio accessibility (speech recognition + text-to-speech synthesis), Khetii functions reliably on budget smartphones and low-connectivity networks.

---

## ✨ Key Highlights & Differentiators

* 🧠 **Vision AI + KCC Knowledge Graph Integration**: When a farmer photographs an afflicted crop or leaf, Gemini Vision assesses the visual symptoms, which triggers a semantic search through **170,000+ verified Kisan Call Center (KCC) & ICAR records** to deliver validated agricultural recommendations rather than hallucinated treatments.
* 🍔 **Ultra-Clean Neo-Brutalist Top Navigation & Slide-Over Drawer**: Minimalist floating header featuring only the brand emblem on the left and a prominent hamburger button on the right with a live shopping cart badge. All secondary controls (global search, farmer account, cart overview, language switch, theme toggle, and 10 core service links) live seamlessly inside the slide-over drawer.
* 📱 **Mobile-First Responsive Architecture**: Zero horizontal scrolling, auto-collapsing grids, safe modal heights with inner scrolling, iOS-safe 16px form inputs to prevent zoom jitter, and a thumb-friendly bottom navigation bar.
* 🛡️ **Agricultural Safety Guardrails**: Strict safety guidelines prevent AI hallucinations regarding unapproved chemical dosages or guaranteed diagnoses. The AI phrases observations cautiously ("*This image shows symptoms that may be consistent with...*") and directs farmers to verified KCC experts and agricultural universities.
* 🔒 **Client-Side Privacy for Document Processing**: PDF compilation, perspective document scanning, and image compression execute entirely in the user's browser, eliminating unnecessary server uploads and protecting farmer privacy.
* 🛒 **Farmer Marketplace with Direct WhatsApp Connect**: Buy and sell crops, seeds, bio-fertilizers, and equipment directly with fellow farmers with persistent shopping cart management and one-click WhatsApp chat integration.

---

## 🌾 Core Feature Modules

### 1. 📊 Farm Overview & Dashboard
* **Route**: `/dashboard`
* **Purpose**: A unified cockpit displaying real-time farm diagnostics.
* **Capabilities**:
  * Personalized farmer welcome with district/state GPS indicator and registered acreage.
  * Live hyper-local weather overview: temperature, humidity, wind velocity, and precipitation probability.
  * AI Agronomic Advisory banner with one-click bilingual voice read-out (**TTS**).
  * 3-day forecast strip highlighting daily high/low temperatures and rain risk.
  * Financial snapshot: current month's income, expenses, and net profit ledger.
  * Dynamic shortcuts to recommended government schemes and recent transactions.

### 2. ☀️ Farm Weather Intelligence & Spray Advisor
* **Route**: `/weather`
* **Purpose**: Actionable meteorological planning tailored for farming operations.
* **Capabilities**:
  * Integrates localized meteorological datasets (Open-Meteo & IMD data).
  * **AI Spray Window**: Identifies optimal hours for spraying pesticides or fertilizers based on wind gusts, temperature, and rain likelihood to prevent chemical runoff or leaf scorching.
  * **Smart Irrigation Advisor**: Formulates watering schedules depending on soil moisture levels, humidity, and anticipated rainfall.
  * **Pest & Disease Risk Index**: Early warning forecasts for humidity-driven fungal and insect outbreaks based on regional crop profiles.
  * Audio playback option for farmers listening in the field.

### 3. 🏛️ Government Schemes & Groq Voice AI
* **Route**: `/schemes`
* **Purpose**: Discover, filter, and apply for central and state agricultural welfare programs.
* **Capabilities**:
  * Comprehensive database of verified welfare schemes: PM-KISAN, PM-KUSUM (solar pumps), Soil Health Card, PM Krishi Sinchayee Yojana (micro-irrigation), Kisan Credit Card (KCC), Paramparagat Krishi Vikas Yojana (organic farming), and state subsidies.
  * Categorized filtering by scheme type (Income Support, Irrigation, Credit, Infrastructure, Pension).
  * Detailed breakdown of eligibility criteria, required documentation, financial benefits, and direct links to official government portals.
  * **Groq AI Scheme Assistant**: Integrated conversational AI powered by `llama-3.3-70b-versatile` supporting hands-free **Voice Input** (Web Speech API) in Hindi and English, answering questions about eligibility, application deadlines, and documents.
  * Integrated Text-to-Speech (TTS) audio narration for all scheme benefits.

### 4. 🛡️ PMFBY Crop Insurance & 72-Hour Claim Guide
* **Route**: `/insurance`
* **Purpose**: Demystifying Pradhan Mantri Fasal Bima Yojana (PMFBY).
* **Capabilities**:
  * Tabbed guides explaining standardized farmer premium rates (Kharif: 2%, Rabi: 1.5%, Commercial/Horticultural: 5%).
  * Comprehensive breakdown of covered risk stages: prevented sowing, standing crop damage (drought, flood, pest epidemic), post-harvest losses, and localized natural calamities (hailstorms, landslides).
  * **Interactive 72-Hour Claim Window Roadmap**: Step-by-step guidance on intimating crop loss within 72 hours via the National Crop Insurance App, toll-free helpline (`14447`), local agriculture officers, or insurance service centers.

### 5. 📈 Live Mandi Wholesale Prices (Agmarknet)
* **Route**: `/market`
* **Purpose**: Real-time wholesale APMC mandi price tracking.
* **Capabilities**:
  * Direct client connection to official government APMC feeds (data.gov.in / Agmarknet).
  * Filter by State, District, and Commodity (Wheat, Paddy, Mustard, Soybean, Onion, Potato, Cotton, etc.).
  * Displays Minimum, Maximum, and Modal wholesale prices (₹ per Quintal) along with arrival dates and crop varieties.
  * Visual comparative view highlighting price disparities across nearby district mandis to help farmers choose the most profitable marketplace.

### 6. 🛍️ Farmer Marketplace (Kisan Haat)
* **Route**: `/marketplace`
* **Purpose**: Direct peer-to-peer agro-trade platform eliminating commission agents.
* **Capabilities**:
  * **Dual Trade Tabs**: Direct Farmer Listings (MongoDB stored) and Live External Agricultural Trade listings.
  * Categories: Crops & Produce, High-yield Seeds, Organic Manure & Fertilizers, Tools & Equipment, Bio-pesticides, and Livestock/Fodder.
  * **Persistent Shopping Cart**: Managed via `localStorage` with real-time synchronized badge counts displayed on the top navigation bar and hamburger drawer.
  * **Verified Product & Seller Detail Modal**: Detailed description, quantity, price per unit, verified grower badge, and community star-ratings with submission capabilities.
  * **1-Click Direct WhatsApp Connect**: Generates a pre-filled WhatsApp message directed to the seller's verified contact number containing product details, price, and inquiry text.
  * Direct telephone call shortcut for immediate negotiations.

### 7. 🌾 Farmer Digital Services
* **Route**: `/documents`, `/services`
* **Purpose**: Four practical digital utility tools built for everyday farming and documentation.
* **Services Included**:
  1. 🧠 **Hero Service: Image → AI Information (`ImageAiService`)**:
     - Upload or take a photo of crops, leaves, pests, symptoms, seeds, or agricultural supplies.
     - Powered by Google Gemini Vision (`gemini-1.5-flash`).
     - Returns structured, non-hallucinatory assessments: detected crop, visual observations, potential issues, recommended field actions, safety warnings, and expert review triggers.
     - **Connected to KCC Database**: Automatically queries the verified Kisan Call Center records based on identified crop and symptom, appending ICAR-backed solutions.
  2. 🖼️ **Images → PDF (`ImagesToPdfService`)**:
     - Client-side compiler that converts multiple physical photographs into a single clean PDF.
     - Supports page reordering, individual page rotation, page deletion, A4 document scaling, and automated file naming (`Khetii_Documents.pdf`).
     - Ideal for bank loans, KCC verification, and portal uploads without uploading raw images to remote servers.
  3. 📸 **Smart Document Scanner (`DocumentScannerService`)**:
     - Transforms smartphone photos of physical land records (Khasra, Khatauni), receipts, or stamp papers into legible scanned copies.
     - Client-side canvas image processing: perspective straightening, brightness boost, contrast sharpening, shadow reduction, and high-contrast B&W photocopy filters.
  4. 📦 **Smart File Compressor (`FileCompressorService`)**:
     - Reduces image sizes to strict government upload thresholds: 50 KB, 100 KB, 200 KB, 500 KB, 1 MB, or 2 MB.
     - Displays live comparisons of original file size, compressed size, quality percentages, and preview downloads.

### 8. 💰 Khata Bahi (Farmer Finance & Profit Ledger)
* **Route**: `/finance`
* **Purpose**: Intuitive farm accounting and seasonal balance management.
* **Capabilities**:
  * Quick logging of seasonal farm income (Crop sales, Subsidies, Equipment rental, Dairy) and expenses (Seeds, Fertilizers, Sprays, Harvester/Labor, Diesel, Electricity, Mandi fees).
  * Real-time metrics calculating total seasonal income, expenses, and net profit balance.
  * Category breakdown progress bars illustrating which inputs (e.g. diesel or fertilizers) consume the highest proportion of operational capital.

### 9. 📚 Agriculture Knowledge Hub & 1.7L+ KCC Records
* **Route**: `/knowledge`
* **Purpose**: Scientific agronomy reference and ICAR advisory search.
* **Capabilities**:
  * Curated package of practices (POP), integrated pest management (IPM), soil testing methodologies, and water conservation guides.
  * Semantic search engine indexing **170,000+ verified Kisan Call Center (KCC) records** containing real farmer queries and expert agronomic answers.
  * Gemini AI semantic query expansion matching colloquial regional terminology to scientific terms.

### 10. 💬 Local Kisan Samvaad (Community Forum)
* **Route**: `/samvaad`
* **Purpose**: Hyper-local farmer community discussions.
* **Capabilities**:
  * Post queries, field observations, and success stories.
  * Cloudinary integration for image uploads.
  * Region-specific and crop-specific thread filtering.

---

## 🏗️ System Architecture & Data Flow

```text
                                 ┌────────────────────────────────────────────────────────┐
                                 │                   KHETII FRONTEND                      │
                                 │          (React 18 + Vite + Neo-Brutalist UI)          │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │
                              ┌──────────────────────────────┼──────────────────────────────┐
                              │                              │                              │
                     Client-Side Engines            REST API Requests (Axios)        Browser Web Speech
                     - Images to PDF (jsPDF)        - JWT Bearer Header              - SpeechRecognition (Voice)
                     - Canvas Scanner               - Multipart / JSON               - SpeechSynthesis (TTS)
                     - File Compressor                       │                              │
                              │                              ▼                              │
                              │                  ┌────────────────────────┐                 │
                              │                  │   EXPRESS.JS BACKEND   │                 │
                              │                  │     (Port 5001)        │                 │
                              │                  └───────────┬────────────┘                 │
                              │                              │                              │
          ┌───────────────────┴────────────────┐             │                              │
          ▼                                    ▼             │                              ▼
  Local Browser Memory              No Remote Storage        │                    Local Audio Speaker
  (Client Privacy Protected)                                 │
                                                             ▼
                                     ┌─────────────────────────────────────────┐
                                     │     CONTROLLERS & SERVICE INTEGRATION   │
                                     └───────────────────────┬─────────────────┘
                                                             │
                  ┌──────────────────────┬───────────────────┼────────────────────┬────────────────────┐
                  ▼                      ▼                   ▼                    ▼                    ▼
          ┌───────────────┐      ┌───────────────┐   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
          │   MONGODB /   │      │  GEMINI VISION│   │    GROQ AI    │    │  AGMARKNET /  │    │  CLOUDINARY   │
          │   MONGOOSE    │      │  (1.5 FLASH)  │   │  (LLAMA 3.3)  │    │  DATA.GOV.IN  │    │   STORAGE     │
          │  Users, Posts,│      │  Crop & Pest  │   │ Scheme Voice  │    │  Live Mandi   │    │  Samvaad Post │
          │ Listings, Tx  │      │ Diagnostics   │   │  & Advisory   │    │ Wholesale Rs  │    │  Photo Upload │
          └───────┬───────┘      └───────┬───────┘   └───────────────┘    └───────────────┘    └───────────────┘
                  │                      │
                  └──────────┬───────────┘
                             ▼
                 ┌───────────────────────┐
                 │  KCC SEMANTIC ENGINE  │
                 │  1.7L+ ICAR Records   │
                 └───────────────────────┘
```

---

## 🎨 Neo-Brutalist Design System & Mobile UX

Khetii features a bold, accessible, and intentional **Neo-Brutalist aesthetic**:
* **High Contrast & Clarity**: Thick jet-black borders (`border: 3px solid #000000`), crisp offset drop-shadows (`box-shadow: 4px 4px 0px #000000`), and zero blurry gradients ensuring high visibility under bright direct sunlight in agricultural fields.
* **Functional Color Palette**:
  * `--nb-yellow` (`#facc15`): Highlights, action badges, and menu triggers.
  * `--nb-green-bright` (`#22c55e`): Growth, verified states, and primary actions.
  * `--nb-canvas` (`#f8fafc`): Light background canvas.
  * `--nb-black` (`#000000`): Pure borders and primary typography.
* **Theme System**: Full light mode and dark mode support with contrast-preserving CSS rules.
* **Responsive Breakpoints**:
  * Desktop ($\ge 1024\text{px}$): Expansive 3 and 4-column card layouts.
  * Tablet ($769\text{px} - 1023\text{px}$): Balanced 2-column grids with floating header.
  * Mobile ($\le 768\text{px}$): Floating header collapses to $56\text{px}$ with logo + hamburger, grids collapse to 1 column, modals conform to `calc(100vw - 20px)`, tables offer touch momentum scrolling, and inputs lock to $16\text{px}$ font-size to prevent unwanted iOS Safari zooming.

---

## 💻 Tech Stack

### Frontend
| Technology | Purpose |
| :--- | :--- |
| **React 18.3** | Component-driven UI library |
| **Vite 5.4** | Ultra-fast build tool and development server |
| **React Router v6** | Client-side routing and protected route wrappers |
| **i18next & react-i18next** | Multilingual localization (Devanagari Hindi & English) |
| **Lucide React** | Consistent, legible icon library |
| **jsPDF** | Client-side multipage PDF generation |
| **Axios** | Promised-based HTTP client with auth interceptors |

### Backend
| Technology | Purpose |
| :--- | :--- |
| **Node.js (v18+)** | JavaScript runtime environment |
| **Express.js (v4.21)** | RESTful API server framework |
| **Mongoose (v8.7)** | MongoDB object modeling and validation |
| **MongoDB / In-Memory Server** | Database persistence with automated memory fallback |
| **JSONWebToken (JWT)** | Stateless farmer authentication |
| **Multer** | Multipart form data and image buffer handling |
| **Cloudinary SDK** | Cloud-based media storage for community posts |

### Artificial Intelligence & Third-Party APIs
| Service / API | Model / Endpoint | Application |
| :--- | :--- | :--- |
| **Google Gemini** | `gemini-1.5-flash` | Multimodal visual inspection & crop symptom diagnosis |
| **Groq SDK** | `llama-3.3-70b-versatile` | Ultra-low latency conversational Scheme & Weather AI |
| **Open-Meteo & IMD** | Hourly & Daily APIs | Localized farm weather and spray window modeling |
| **Agmarknet (data.gov.in)** | Mandi Commodity Feeds | Real-time wholesale agricultural pricing |
| **OpenStreetMap Nominatim** | Search Geocoding | District/State fallback latitude & longitude resolution |

---

## 📁 Repository Structure

```text
khetii/
├── backend/
│   ├── config/
│   │   └── db.js                        # Mongoose connection & in-memory fallback
│   ├── controllers/
│   │   ├── authController.js            # Farmer register, login, profile updates
│   │   ├── financeController.js         # Income, expenses, and ledger summary
│   │   ├── insuranceController.js       # PMFBY insurance guidelines and rates
│   │   ├── kccController.js             # Kisan Call Center query retrieval
│   │   ├── knowledgeController.js       # Package of practices & agronomy guides
│   │   ├── marketController.js          # Agmarknet live mandi rates
│   │   ├── marketplaceController.js     # Farmer listings & marketplace CRUD
│   │   ├── ocrController.js             # Fallback OCR history
│   │   ├── postController.js            # Samvaad community threads
│   │   ├── schemeController.js          # Government schemes & AI advisor
│   │   └── weatherController.js         # Weather intelligence & advisories
│   ├── data/
│   │   ├── raw_kcc.csv                  # Verified 1.7L+ KCC Q&A records
│   │   ├── insurance.json               # PMFBY rates, covered stages & rules
│   │   ├── knowledge.json               # Agronomic guides, irrigation & IPM
│   │   └── schemes.json                 # PM-KISAN, PMFBY, KCC, Soil Health data
│   ├── middleware/
│   │   ├── auth.js                      # JWT verification middleware
│   │   ├── errorHandler.js              # Centralized JSON error handler
│   │   └── upload.js                    # Multer memory storage (5MB max)
│   ├── models/
│   │   ├── Listing.js                   # Marketplace product schema
│   │   ├── OcrScan.js                   # Document scan record schema
│   │   ├── Post.js                      # Samvaad community post schema
│   │   ├── Transaction.js               # Finance ledger schema
│   │   └── User.js                      # Farmer user profile schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── digitalServicesRoutes.js     # Image AI and digital utilities routes
│   │   ├── financeRoutes.js
│   │   ├── insuranceRoutes.js
│   │   ├── kccRoutes.js
│   │   ├── knowledgeRoutes.js
│   │   ├── marketRoutes.js
│   │   ├── marketplaceRoutes.js
│   │   ├── ocrRoutes.js
│   │   ├── postRoutes.js
│   │   ├── schemeRoutes.js
│   │   └── weatherRoutes.js
│   ├── services/
│   │   ├── cloudinaryService.js         # Cloudinary asset management
│   │   ├── farmIntelligenceEngine.js    # Spray window & irrigation calculations
│   │   ├── geminiService.js             # Gemini Vision & text intelligence
│   │   ├── groqSchemeService.js         # Groq conversational scheme engine
│   │   ├── groqWeatherService.js        # Groq localized weather advisory
│   │   ├── imageAiService.js            # Visual diagnosis + KCC integration
│   │   ├── kccService.js                # KCC search and retrieval logic
│   │   ├── marketService.js             # Agmarknet data connector
│   │   ├── marketplaceService.js        # External agro-trade adapter
│   │   ├── ocrService.js                # OCR.space integration
│   │   └── weatherService.js            # Open-Meteo weather client
│   ├── .env.example
│   ├── package.json
│   └── server.js                        # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── videos/
│   │   │       └── farmer.mp4           # Cinematic background video for landing
│   │   ├── components/
│   │   │   ├── digitalServices/
│   │   │   │   ├── DocumentScannerService.jsx  # Client canvas document scanner
│   │   │   │   ├── FileCompressorService.jsx   # Target KB file compressor
│   │   │   │   ├── ImageAiService.jsx          # Vision diagnosis + KCC card
│   │   │   │   └── ImagesToPdfService.jsx      # Multi-image PDF compiler
│   │   │   ├── EmptyState.jsx           # Neo-Brutalist actionable empty state
│   │   │   ├── GlobalSearch.jsx         # Cross-module unified search bar
│   │   │   ├── Header.jsx               # Floating header + Slide-over Drawer
│   │   │   ├── LanguageSwitcher.jsx     # Hindi / English switcher
│   │   │   ├── Loader.jsx               # Neo-brutalist loading indicator
│   │   │   ├── MobileNav.jsx            # Mobile thumb navigation bar
│   │   │   ├── Modal.jsx                # Universal neo-brutalist modal dialog
│   │   │   ├── Sidebar.jsx              # Desktop navigation sidebar
│   │   │   ├── ThemeToggle.jsx          # Light / Dark theme button
│   │   │   └── TTSButton.jsx            # Bilingual Text-to-Speech audio button
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # User authentication and profile state
│   │   │   └── ThemeContext.jsx         # Theme state and DOM attribute synchronization
│   │   ├── i18n/
│   │   │   ├── locales/
│   │   │   │   ├── en.json              # English localization strings
│   │   │   │   └── hi.json              # Natural Devanagari Hindi strings
│   │   │   └── index.js                 # i18next configuration
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Farm cockpit with live indicators
│   │   │   ├── Documents.jsx            # 4 Farmer Digital Services
│   │   │   ├── Finance.jsx              # Khata Bahi financial ledger
│   │   │   ├── Insurance.jsx            # PMFBY insurance guide & claims
│   │   │   ├── Knowledge.jsx            # ICAR agronomy and KCC search
│   │   │   ├── Landing.jsx              # Hero video presentation
│   │   │   ├── Login.jsx                # Farmer authentication
│   │   │   ├── Market.jsx               # Agmarknet mandi rates
│   │   │   ├── Marketplace.jsx          # Kisan Haat commerce & cart
│   │   │   ├── Profile.jsx              # Farmer parameters and crops
│   │   │   ├── Register.jsx             # Onboarding registration
│   │   │   ├── Samvaad.jsx              # Local community forum
│   │   │   └── Weather.jsx              # Farm intelligence & spray windows
│   │   ├── services/
│   │   │   ├── api.js                   # Base Axios instance with auth headers
│   │   │   └── [module]Service.js       # Module-specific API client services
│   │   ├── styles/
│   │   │   ├── tokens.css               # Neo-brutalist CSS variables
│   │   │   └── global.css               # Component classes and media queries
│   │   ├── utils/
│   │   │   └── tts.js                   # Web Speech API speech synthesis utility
│   │   ├── App.jsx                      # App root and route hierarchy
│   │   └── main.jsx                     # Vite React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md                            # Comprehensive Project Guide (This file)
└── README_WORK.md                       # Initial implementation log
```

---

## ⚙️ Environment Variables

Create a `.env` file in `backend/` based on `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5001` | Server listening port |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Allowed CORS client origin |
| `MONGODB_URI` | **Required** | `mongodb://127.0.0.1:27017/kheti` | MongoDB connection string (falls back to in-memory) |
| `JWT_SECRET` | **Required** | `kheti_jwt_production_secret_key` | Secret key for signing authentication tokens |
| `GEMINI_API_KEY` | Recommended | `AIzaSy...` | Google Gemini API key for Image AI and semantic query processing |
| `GEMINI_MODEL` | Optional | `gemini-1.5-flash` | Gemini model version |
| `GROQ_API_KEY` | Recommended | `gsk_...` | Groq AI key for Voice Scheme Advisor and Weather Intelligence |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Groq Llama model version |
| `GROQ_AI_ENABLED` | Optional | `true` | Toggle Groq AI capabilities |
| `CLOUDINARY_CLOUD_NAME`| Optional | `your_cloud_name` | Cloudinary storage identifier for Samvaad photos |
| `CLOUDINARY_API_KEY` | Optional | `your_api_key` | Cloudinary access key |
| `CLOUDINARY_API_SECRET`| Optional | `your_api_secret` | Cloudinary secret |

> [!NOTE]
> All AI and Cloudinary keys remain strictly **backend-only**. The frontend never exposes secret API tokens to the client browser.

---

## 🚀 Step-by-Step Installation & Local Setup

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **MongoDB**: Local MongoDB instance (`mongod`) or a MongoDB Atlas URI (If unavailable, the backend automatically boots an in-memory database).

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/khetii.git
cd khetii
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your favorite editor to add Gemini and Groq API keys
```

Start the backend development server:
```bash
npm run dev
# Server will start on http://localhost:5001
```

### 3. Configure Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend will launch on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 📡 API Reference & Endpoints

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new farmer profile.
* `POST /api/auth/login` — Authenticate farmer with credentials.
* `GET /api/auth/me` — Retrieve logged-in farmer profile (`Bearer <JWT>`).
* `PUT /api/auth/profile` — Update farmer parameters, acreage, and preferred crops.

### 🌤️ Weather Intelligence (`/api/weather`)
* `GET /api/weather/current` — Current temperature, humidity, precipitation, and conditions.
* `GET /api/weather/intelligence` — AI-calculated spray window, irrigation guidelines, and pest risks.

### 🏛️ Government Schemes (`/api/schemes`)
* `GET /api/schemes` — Fetch all verified welfare schemes (with category and state filters).
* `GET /api/schemes/:id` — Detailed scheme documentation and eligibility rules.
* `POST /api/schemes/:id/ask-ai` — Groq AI scheme advisor responding to farmer questions.

### 📈 Live Mandi Prices (`/api/market`)
* `GET /api/market/prices` — Real-time wholesale mandi prices (Query parameters: `state`, `district`, `commodity`).
* `GET /api/market/filters` — Available states and commodities currently active on Agmarknet.

### 🛍️ Marketplace (`/api/marketplace`)
* `GET /api/marketplace` — Fetch farmer product listings (MongoDB).
* `GET /api/marketplace/external` — Live agricultural marketplace listings.
* `POST /api/marketplace` — Post a new listing (`Bearer <JWT>`).
* `PUT /api/marketplace/:id` — Update listing (`Bearer <JWT>`).
* `DELETE /api/marketplace/:id` — Remove listing (`Bearer <JWT>`).
* `POST /api/marketplace/:id/review` — Submit buyer review and rating.

### 🌾 Digital Services (`/api/digital-services`)
* `POST /api/digital-services/image-analyze` — Upload photo for Gemini Vision diagnosis + KCC recommendation linkage.

### 💰 Finance Ledger (`/api/finance`)
* `GET /api/finance/transactions` — Fetch financial ledger records (`Bearer <JWT>`).
* `POST /api/finance/transactions` — Add an income or expense transaction (`Bearer <JWT>`).
* `GET /api/finance/summary` — Aggregate balance, monthly earnings, and category breakdown.

### 📚 Knowledge Hub & KCC (`/api/knowledge`, `/api/kcc`)
* `GET /api/knowledge` — Agronomic practices and crop manuals.
* `GET /api/kcc/search` — Semantic query search across 170,000+ KCC expert records.

---

## 🛡️ Agricultural Safety & Responsible AI

Agricultural decisions directly impact crop yields, household livelihood, and food safety. Khetii adheres to strict safety boundaries:

```text
                                  FARMER UPLOADS PHOTO
                                           │
                                           ▼
                                 GEMINI VISION ENGINE
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             UNCLEAR / POOR LIGHTING                 SYMPTOMS OBSERVED
                        │                                     │
                        ▼                                     ▼
             Prompt Farmer to Retake             Extract Identified Crop & Problem
             Clear Daylight Photo                (e.g., "Mustard", "Aphids")
                                                              │
                                                              ▼
                                                   KCC KNOWLEDGE RETRIEVAL
                                                   (1.7L+ ICAR-Validated Records)
                                                              │
                                                              ▼
                                                   FORMULATE SAFE RESPONSE
                                                   - Visual observations
                                                   - Possible issues (cautious)
                                                   - ICAR-backed advisory
                                                   - Mandatory university disclaimer
```

1. **No Hallucinated Diagnoses**: The system never issues definitive diagnoses like "*Your crop definitely has Disease X*". It uses disciplined observations: "*This image shows symptoms consistent with...*".
2. **Strict Chemical & Dosage Restrictions**: Chemical pesticide formulations or unauthorized dosages are never generated from AI imagination. Only verified solutions indexed from ICAR and KCC datasets are provided.
3. **Mandatory University & KCC Disclaimer**: Every vision analysis concludes with an explicit disclaimer encouraging physical inspection by local Krishi Vigyan Kendra (KVK) scientists or calling the Kisan Call Centre (`1800-180-1551`).

---

## 📦 Production Build & Deployment

### Build Frontend
```bash
cd frontend
npm run build
```
The compiled production bundle will be generated in `frontend/dist/`.

### Run Production Server
```bash
cd backend
NODE_ENV=production npm start
```

### Recommended Production Deployment
* **Frontend**: Deploy on [Vercel](https://vercel.com/) or [Cloudflare Pages](https://pages.cloudflare.com/) with SPA rewrite rules configured.
* **Backend**: Deploy on [Render](https://render.com/), [Railway](https://railway.app/), or an AWS EC2 / DigitalOcean Ubuntu droplet running PM2.
* **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0/M10 cluster with automated daily backups.

---

## 🤝 Contributing & License

Contributions from developers, agronomists, and agricultural enthusiasts are warmly welcomed!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

### License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>खेती (Khetii) — Built with ❤️ for the Annadata (अन्नदाता) of India.</b><br>
  <i>Empowering Indian Agriculture through Practical Digital Innovation.</i>
</p>
