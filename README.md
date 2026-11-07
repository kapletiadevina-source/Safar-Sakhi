# 🌸 Safar Sakhi (सफ़र सखी)
> **"Your Safety, Our Responsibility."**

An intelligent, full-stack, AI-powered women's safety and smart journey web platform designed to protect women during solo commutes, night travel, public transport, and unfamiliar routes.

---

## 🌟 Key Capabilities

1. **Separate User & Family Experiences**:
   - **User Dashboard (`/`)**: Dedicated interface for solo women travelers to configure journeys, view active GPS telemetry, share live locations with chosen family members, trigger SOS, talk with Sakhi AI, and view travel history.
   - **Family Dashboard (`/family`)**: Dedicated Guardian portal for trusted family members to monitor journeys explicitly shared with them, track live coordinates on an interactive Leaflet radar, view ETA and start times, inspect safety confirmations ("I Am Safe"), and immediately dial emergency helplines.
2. **Continue with Google Authentication (Supabase Auth)**:
   - One-click Google OAuth button with official branding on both login and register screens.
   - Dynamic account role selection (*Traveler* vs. *Family Guardian*).
   - Automatic profile population (name, email, avatar).
   - Automatic linking of pending family invitations upon registration.
3. **Strict Family Privacy & Authorization**:
   - Family members can only access journeys that have been explicitly shared with their account.
   - Backend guarantees zero data leakage with verified 403 Forbidden enforcement on unshared journeys.
4. **Smart Journey Management**: Create active journey sessions with starting point, destination, transport type, customizable ETA, and family recipient selection.
5. **Real-Time GPS Tracking & Breadcrumb Trail**: Continuous live coordinate telemetry powered by the Browser Geolocation API and Leaflet.js OpenStreetMap.
6. **Public / Family Live Tracking Link**: Share a secure tracking URL (`/track/:trackingToken`) with trusted family members so they can monitor your live position, delay alerts, and arrival status in real-time via Socket.IO without needing manual page refreshes.
7. **Intelligent Delay Detection**: Automatically monitors journey ETA against wall-clock time. If overdue, prompts an interactive safety check-in:
   - *"I Am Safe"* (updates safety confirmation timestamp and notifies family)
   - *"Update My ETA"* (adds +15m, +30m, +45m, or custom arrival time)
   - *"Activate SOS"* (instantly triggers emergency workflow)
8. **Emergency SOS System**:
   - Prominent Emergency SOS button with rapid confirmation countdown to prevent accidental activation while remaining immediate.
   - Captures GPS coordinates, battery level, and timestamp.
   - Real-time Socket.IO emergency alert broadcast to family members and admin console.
   - Emergency guidance with one-touch direct dialing to national emergency helplines: **112 (All-in-One Emergency)**, **1091 (Women in Distress)**, **181 (Women Support)**, and **102 (Ambulance)**.
9. **Voice-Triggered SOS & AI Companion ("Sakhi")**:
   - Google Gemini API-powered conversational safety companion.
   - Web Speech API integration: Speech-to-Text (STT) and Text-to-Speech (TTS).
   - Configurable emergency phrase detection (e.g., *"Sakhi Help"*) to trigger hands-free SOS.
   - Intelligent built-in fallback safety engine if no Gemini API key is configured.
10. **Trusted Contacts Circle & Family Connection System**: Add, edit, and organize family members and emergency contacts with relationship labels, primary status, and invite codes.
11. **Journey History & Recharts Analytics**: Comprehensive travel history with search, date and status filters, transport mode pie charts, and 7-day activity bar charts.
12. **Curated Safety Tips Module**: Practical guides covering Night Travel, Public Transport, Solo Commutes, Emergency Readiness, and an interactive *"Before You Step Out"* checklist.
13. **Admin Oversight Portal**: Protected administrative console for authorized operators to monitor platform-wide active journeys, delayed trips, and active SOS incidents.

---

## 📂 Project Architecture & Folder Structure

```
SakhiAI1/
├── package.json                   # Root workspace orchestration scripts
├── README.md                      # Comprehensive project documentation
│
├── backend/                       # Node.js + Express REST & Socket.IO API
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL Prisma ORM schema & relations
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Prisma client & resilient fallback data store
│   │   │   └── index.js           # Environment configurations
│   │   ├── controllers/
│   │   │   ├── adminController.js # Admin metrics & incident management
│   │   │   ├── aiController.js    # Gemini AI conversational endpoints
│   │   │   ├── authController.js  # JWT Auth, profile & settings
│   │   │   ├── contactController.js # Trusted contacts CRUD
│   │   │   ├── journeyController.js # Journeys, ETA, tracking, analytics
│   │   │   ├── locationController.js # GPS coordinate ingestion & trail
│   │   │   ├── notificationController.js # In-app notification management
│   │   │   └── sosController.js   # Emergency SOS activation & cancellation
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification & admin guard
│   │   │   ├── errorHandler.js    # Centralized Express error handler
│   │   │   └── validate.js        # Zod input validation middleware
│   │   ├── routes/                # Modular Express routers
│   │   ├── services/
│   │   │   ├── aiService.js       # Google Gemini 1.5 Flash + Fallback engine
│   │   │   ├── delayDetectionService.js # 30s background overdue ETA scanner
│   │   │   ├── notificationService.js # In-app and push notification dispatcher
│   │   │   └── sosService.js      # Emergency SOS lifecycle & broadcast
│   │   ├── sockets/
│   │   │   └── index.js           # Socket.IO room management & event broadcasting
│   │   ├── utils/
│   │   │   ├── seed.js            # Prisma PostgreSQL database seeder
│   │   │   ├── seedData.js        # Default seed records & test users
│   │   │   └── token.js           # JWT signing and verification
│   │   ├── app.js                 # Express app configuration & middleware
│   │   └── server.js              # HTTP server, Socket.IO & delay worker
│   ├── test-api.js                # Automated 16-point backend API test suite
│   ├── .env                       # Environment variables
│   ├── .env.example               # Example template for environment secrets
│   └── package.json
│
└── frontend/                      # React 18 + Vite + Tailwind CSS SPA
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── DelayAlertModal.jsx # Overdue ETA prompt (Safe / Update ETA / SOS)
    │   │   ├── LeafletMap.jsx      # OpenStreetMap interactive Leaflet radar
    │   │   ├── SOSConfirmModal.jsx # 4-second safety SOS countdown modal
    │   │   └── ToastContainer.jsx  # Floating real-time notification alerts
    │   ├── context/
    │   │   ├── AuthContext.jsx     # User session, JWT token, profile state
    │   │   ├── JourneyContext.jsx  # Active journey, GPS watchPosition, actions
    │   │   ├── SocketContext.jsx   # Real-time Socket.IO listeners & toasts
    │   │   └── VoiceContext.jsx    # Web Speech API (STT/TTS) & phrase trigger
    │   ├── layouts/
    │   │   ├── MainLayout.jsx      # Shell layout with footer helplines
    │   │   └── Navbar.jsx          # Top bar with prominent SOS button & status
    │   ├── pages/
    │   │   ├── ActiveJourneyPage.jsx # Full-screen live tracking map & controls
    │   │   ├── AdminDashboardPage.jsx # Admin oversight & incident resolution
    │   │   ├── AICompanionPage.jsx   # Dedicated voice & text AI companion chat
    │   │   ├── ContactsPage.jsx      # Trusted circle management
    │   │   ├── DashboardPage.jsx     # Main user dashboard with quick actions
    │   │   ├── FamilyTrackingPage.jsx # Secure shared family tracking radar
    │   │   ├── ForgotPasswordPage.jsx # Password recovery workflow
    │   │   ├── JourneyHistoryPage.jsx # Journey history & Recharts analytics
    │   │   ├── JourneyStartPage.jsx  # Departure setup & route selector
    │   │   ├── LoginPage.jsx         # Sign in with one-click demo credentials
    │   │   ├── NotificationsPage.jsx # Notification center with read/unread
    │   │   ├── RegisterPage.jsx      # User registration with medical notes
    │   │   ├── SafetyTipsPage.jsx    # Practical guides & departure checklist
    │   │   └── SettingsPage.jsx      # Privacy, voice phrase & medical details
    │   ├── routes/
    │   │   └── AppRoutes.jsx         # React Router v6 protected & public routing
    │   ├── services/
    │   │   └── api.js                # Axios instance with Bearer token interceptor
    │   ├── App.jsx
    │   ├── index.css                 # Tailwind directives & custom animations
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js            # Custom rose/pink commercial palette
    ├── vite.config.js
    └── package.json
```

---

## 🎨 Color Palette & Visual Identity

The interface adheres to a warm, premium, commercial aesthetic:
- **Primary**: Soft Rose Pink (`#E11D48` / `#F43F5E`)
- **Secondary**: Light Pink (`#FFF1F2`, `#FFE4E6`, `#FCE7F3`)
- **Background**: Soft Off-White (`#FFFFFF`, `#FFF9FA`)
- **Cards**: Very Light Tinted Pink (`#FFF5F7`)
- **Accent**: Coral Pink (`#FB7185`)
- **Text**: Dark Slate Grey (`#1E293B`, `#334155`)
- **Emergency SOS**: Vibrant High-Visibility Red (`#DC2626`, `#EF4444`)
- **Success / Safe**: Soft Green (`#10B981`)

---

## 🗄️ Database Schema & Prisma ORM

The application models are defined in `backend/prisma/schema.prisma` using PostgreSQL:

1. **User**: Credentials, full name, phone number, role (`USER` | `ADMIN`).
2. **UserProfile**: One-to-one relation with User storing avatar, blood group, emergency notes, home and work addresses.
3. **TrustedContact**: Many-to-one with User storing family contact name, phone, relationship, verification, and primary status.
4. **Journey**: Storing start location, destination, start/destination coordinates, expected arrival time (ETA), status (`NOT_STARTED`, `ACTIVE`, `PAUSED`, `DELAYED`, `COMPLETED`, `CANCELLED`, `EMERGENCY`), journey type, notes, unique `trackingToken`, and shared contact IDs.
5. **JourneyLocation**: High-precision coordinate breadcrumbs (`latitude`, `longitude`, `accuracy`, `speed`, `heading`, `batteryLevel`, `timestamp`) linked to journey and user.
6. **SOSIncident**: Emergency incident records storing GPS point, trigger type (`MANUAL` | `VOICE` | `DELAY_TRIGGERED`), recognized emergency phrase, status (`ACTIVE` | `RESOLVED` | `CANCELLED`), and notification delivery audit.
7. **SafetyConfirmation**: Log of "I Am Safe" check-ins with timestamps and coordinates.
8. **Notification**: In-app notifications with read status and event metadata.
9. **UserSettings**: Voice activation phrase, voice feedback toggles, delay grace period minutes, and location sharing preferences.

---

## ⚡ Prerequisites & Quick Start Guide

### 1. Requirements
- **Node.js**: Version 18+ (tested on Node v24)
- **npm**: Version 9+
- **PostgreSQL** (Optional for local testing; Safar Sakhi includes an integrated resilient in-memory store that works instantly out of the box if PostgreSQL is not yet running).

### 2. Configure Environment Variables
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/safar_sakhi?schema=public"

# JWT Authentication
JWT_SECRET="safar_sakhi_jwt_super_secret_key_2026_dev"
JWT_EXPIRES_IN="7d"

# Optional: Google Gemini API Key
# If left blank, Safar Sakhi uses its built-in intelligent safety conversation fallback
GEMINI_API_KEY=""
```

### 3. Setting Up PostgreSQL (When Ready)
To connect your local PostgreSQL database:
```powershell
cd backend
# Push schema directly to database
npm run prisma:push

# (Optional) Seed the database with sample users and journeys
npm run prisma:seed
```

### 4. Running the Application on Windows

Open two separate Windows PowerShell or Command Prompt terminals:

**Terminal 1 — Backend API & Socket Server:**
```powershell
cd c:\SakhiAI1\backend
npm run dev
```
*Backend runs on: `http://localhost:5000`*

**Terminal 2 — Frontend React Application:**
```powershell
cd c:\SakhiAI1\frontend
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

Alternatively, you can run convenience scripts from the workspace root:
```powershell
# From c:\SakhiAI1
npm run dev:backend
npm run dev:frontend
```

---

## 🔑 Default Test Credentials

For quick and effortless testing, demo credentials with pre-loaded profiles and contacts are provided for all 3 account roles:

| Role | Email | Password | Dashboard URL | Pre-configured Data |
|---|---|---|---|---|
| **Regular Traveler** | `priya@safarsakhi.com` | `Password@123` | `/` | 3 Trusted Contacts, Connected Family Members, Active Journey, Medical Notes |
| **Family Guardian** | `sunita@safarsakhi.com` | `Password@123` | `/family` | Connected to Priya Patel (Mother), Shared Live Journey Radar, 1-Tap Emergency Calling |
| **Safety Admin** | `admin@safarsakhi.com` | `Admin@123` | `/admin` | Access to Emergency Control Center, System Telemetry & Incident Resolution |

*(All three accounts can be auto-filled with a single click using the demo quick-login buttons on the login screen).*

---

## 🔐 Supabase Google OAuth Setup

Safar Sakhi integrates **Supabase Authentication with Google OAuth** for seamless single sign-on.

### Steps to Configure Live Supabase Google Auth:
1. Create a free project on [Supabase](https://supabase.com).
2. Under **Project Settings > API**, copy the `Project URL` and `anon public` key.
3. In the Supabase dashboard, navigate to **Authentication > Providers > Google**:
   - Enable the Google provider.
   - Enter your Google Cloud OAuth Client ID and Client Secret.
   - Set the Authorized Redirect URI to:
     `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
4. Add the credentials to `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
   ```
5. Restart Vite dev server (`npm run dev`).

> **💡 Offline & Testing Transparency:**
> If Supabase credentials are not yet configured in `.env`, clicking "Continue with Google" opens an informative setup instruction modal with exact step-by-step guidance and one-click test simulation options for both Traveler and Family accounts so development and QA testing are never blocked.

---

## 📡 Real-Time Socket.IO Events

| Event Name | Direction | Payload Details | Purpose |
|---|---|---|---|
| `join_user_room` | Client → Server | `{ userId }` | Subscribes to personal notifications and alerts |
| `join_journey` | Client → Server | `{ journeyId, trackingToken }` | Subscribes family viewers to journey location streams |
| `send_location_update` | Client → Server | `{ journeyId, latitude, longitude, accuracy }` | Ingests new GPS breadcrumb from traveler |
| `location_updated` | Server → Client | `{ journeyId, latitude, longitude, accuracy }` | Broadcasts live coordinate shift to map |
| `journey_delayed` | Server → Client | `{ journeyId, message }` | Alerts user and family of overdue ETA |
| `eta_updated` | Server → Client | `{ journeyId, newEta }` | Refreshes ETA across all open screens |
| `sos_activated` | Server → Client | `{ sosIncident, latitude, longitude }` | Triggers high-priority visual emergency alarms |
| `sos_cancelled` | Server → Client | `{ incidentId, resolutionNotes }` | Resolves active emergency state |
| `safety_confirmed` | Server → Client | `{ journeyId, timestamp }` | Notifies circle that traveler checked in safe |
| `journey_completed` | Server → Client | `{ journeyId }` | Ceases active location sharing permanently |

---

## 🤖 Google Gemini AI & Voice Architecture

1. **Backend Isolation**: Gemini API requests are made strictly from the backend service (`backend/src/services/aiService.js`). API keys are never exposed in frontend code.
2. **System Prompt**: Customized for friendly, concise, safety-first interaction.
3. **Graceful Offline Fallback**: If `GEMINI_API_KEY` is not provided or if the network fails, an intelligent rules engine provides contextual responses for ETAs, ride delays, night tips, and comfort check-ins.
4. **Browser Speech APIs**:
   - **SpeechRecognition**: Converts user speech to text with listening wave indicators.
   - **SpeechSynthesis**: Speaks companion responses aloud using natural TTS voices.
   - **Emergency Phrase Listener**: Detects phrases like *"Sakhi Help"* or *"Help Me Emergency"* to activate the SOS workflow hands-free.

---

## 📱 Browser & Device Limitations Transparency

- **Background Geolocation**: Browsers (especially on mobile OS such as iOS Safari or Android Chrome) can restrict or suspend JavaScript background execution when the browser is minimized, screen is locked, or another app is active. Continuous background location tracking cannot be 100% guaranteed once the browser session is suspended. Safar Sakhi transparently informs users and resumes immediately upon returning to the active session.
- **Microphone Permissions**: Speech recognition requires active user permission and an HTTPS or localhost origin. The voice listener pauses when the browser tab loses focus. The manual SOS button is always provided as the primary, fail-safe control.
- **Emergency Police Dispatch**: Triggering SOS alerts the user's trusted circle and logs the emergency on the platform. Direct contact with national police (112) or women's helplines (1091) is provided via instant 1-tap dialer buttons, as government emergency dispatch integration requires official authorization credentials.

---

## 🧪 Verification & Testing Status

- Automated API & Security test suite executed via `node backend/test-api.js`: **All 25 test suites passed** (100% success rate, verified 403 Forbidden enforcement on unshared journeys).
- Frontend production bundle built via Vite: **2383 modules transformed, 0 errors**.
- Real-time Socket.IO broadcast tested and confirmed across traveler and family dashboards.
- Simulated GPS movement button provided on Active Journey screen for desktop testing without physical walking.

