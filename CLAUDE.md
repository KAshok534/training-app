# AIWMR Training Academy — Principal Architect Reference

> **This file is the single source of truth for anyone (human or AI assistant) working on this project.**
> Read this before writing a single line of code. It covers what exists, what is pending, why decisions were made, and how everything connects.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Product** | AIWMR Training Academy — Progressive Web App |
| **Owner** | Ashrita Institute for Waste Management & Research Pvt Ltd |
| **Lead Trainer** | Dr. Sushanth Gade |
| **Contact** | director@aiwmr.org · +91 9676975725 · www.aiwmr.org |
| **Location** | Hyderabad, Telangana, India |
| **Primary Markets** | India (INR pricing) + Oman / International (USD pricing) |
| **Live URL** | https://training-app-tawny.vercel.app |
| **Repository** | C:\Users\Ashok\source\repos\aiwmr-app-pwa\aiwmr-app |
| **Last Updated** | April 2026 — Razorpay + Brand logos + PWA install banner |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (strict mode) |
| Build | Vite + SWC + vite-plugin-pwa |
| Styling | Pure CSS-in-JS (inline styles) + CSS variables in `index.css` |
| Database | Supabase (PostgreSQL) — Mumbai region (ap-south-1) |
| Auth | Supabase Auth (email + password, email verification ON) |
| Payments | Razorpay ✅ integrated — test mode active (`rzp_test_*`) |
| Hosting | Vercel (auto-deploy from git push) |
| PWA | vite-plugin-pwa (generateSW mode, Workbox) |
| QR Scanning | react-qr-reader (installed — wired to camera) |
| QR Generation | qrcode.react (installed — used in AdminSessionScreen) |

---

## 3. Repository Structure

```
src/
├── types/index.ts              — All TypeScript interfaces (includes logoUrl?: string on Course)
├── data/index.ts               — 15 real AIWMR courses (mock data, mirrors Supabase; CEWM has logoUrl)
├── lib/
│   ├── supabase.ts             — Supabase client (reads .env, graceful fallback to demo mode)
│   └── razorpay.ts             — Razorpay helper (openRazorpay, isRazorpayConfigured — WIRED)
├── context/
│   └── AuthContext.tsx         — Global auth state (REAL auth active — NOT demo)
├── hooks/
│   ├── usePWAInstall.ts        — PWA install prompt logic (captures beforeinstallprompt event)
│   └── useEnrollment.ts        — KEY HOOK: checks if student has paid enrollment
├── components/
│   ├── Icon.tsx                — Typed SVG icon system (20+ icons)
│   ├── UI.tsx                  — Badge, ProgressBar, Btn, Card, Spinner, Divider
│   ├── BottomNav.tsx           — 5-tab bottom navigation
│   ├── InstallBanner.tsx       — PWA install prompt (Android native + Android manual + iOS instructions)
│   ├── DemoBanner.tsx          — "Demo mode" notice (hides when .env is set)
│   ├── EnrollmentGate.tsx      — KEY COMPONENT: gates screens behind paid enrollment
│   └── PreCourseInstructionsModal.tsx — One-time "Before You Begin" instructions sheet (12 rules)
├── screens/
│   ├── SplashScreen.tsx        — 2-second animated splash with AIWMR branding
│   ├── LoginScreen.tsx         — Email/password login + AIWMR logo in form card
│   ├── RegisterScreen.tsx      — Full sign-up with email verification
│   ├── HomeScreen.tsx          — 3-state dashboard (Admin / Enrolled / Not-enrolled)
│   ├── CoursesScreen.tsx       — 15 courses listing; COURSE_LOGO_MAP for per-course logos
│   ├── CourseDetailScreen.tsx  — Course detail + 3-step registration flow (real Razorpay payment)
│   ├── AdminSessionScreen.tsx  — Admin: generate session QR codes, display & manage live sessions
│   ├── LearningScreen.tsx      — Module list (gated — requires paid enrollment)
│   ├── AttendanceScreen.tsx    — QR camera scan + manual code entry + monthly calendar (gated)
│   └── CertificateScreen.tsx   — Certificate viewer + download (gated)
├── App.tsx                     — Root routing logic (InstallBanner renders on login screen too)
├── main.tsx                    — Entry point
└── styles/index.css            — Global CSS variables, animations, PWA layout

public/
├── logo.png                    — AIWMR brand logo (600×245, transparent background PNG)
├── course-logos/
│   └── cewm.png                — CEWM flagship course logo (600×400, transparent background PNG)
├── icons/                      — PWA icons (all generated from AIWMR logo.jpeg via sharp)
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
└── manifest.json               — PWA manifest (icons purpose: "any" — NOT maskable)

scripts/                        — Image generation utilities (run with: node scripts/<file>.mjs)
├── generate-logo.mjs           — Generates public/logo.png (transparent bg, white pixel removal)
├── generate-course-logos.mjs   — Generates public/course-logos/*.png (transparent bg)
└── generate-icons.mjs          — Generates public/icons/* (square format, white bg, for PWA icons)

vite.config.ts                  — Vite + PWA plugin config

supabase/
└── functions/
    └── create-razorpay-order/
        └── index.ts            — Edge Function: creates Razorpay orders server-side (Key Secret stays off browser)
```

---

## 4. Environment Variables

Create `.env` in project root:

```bash
VITE_SUPABASE_URL=https://agthvosbtsiyhmzyzzib.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
VITE_RAZORPAY_KEY_ID=rzp_test_SamdPNMQxoIG5c   # Test key — swap for rzp_live_* when going live
```

**Razorpay Edge Function Secrets** (set via `supabase secrets set` — never in `.env`):
```bash
RAZORPAY_KEY_ID=rzp_test_SamdPNMQxoIG5c
RAZORPAY_KEY_SECRET=<secret — stored in Supabase Edge Function secrets only>
```

**Supabase Project Details:**
- Project ID: `agthvosbtsiyhmzyzzib`
- Region: South Asia (Mumbai) — `ap-south-1`
- Dashboard: https://supabase.com/dashboard/project/agthvosbtsiyhmzyzzib

**Vercel Deployment:**
Add these same env vars in Vercel → Project → Settings → Environment Variables → Production.
Then redeploy (push any commit or trigger manually).

**Demo mode:**
If `.env` is missing, `isSupabaseConfigured = false` and app runs with mock DEMO_USER (Sushanth Gade). All screens work but data is fake.

---

## 5. Supabase Database Schema

### Tables Overview

| Table | Purpose |
|---|---|
| `profiles` | Extended user data (name, phone, org, role) — linked to auth.users |
| `courses` | All 15 AIWMR courses |
| `batches` | Batch schedules per course (morning/evening) |
| `registrations` | Student course enrollments + payment tracking |
| `modules` | Course modules (video/pdf/quiz/assignment) |
| `user_progress` | Per-student module completion status |
| `attendance` | QR-scanned attendance records |
| `session_qr_codes` | Admin-generated QR codes per session |
| `certificates` | Issued certificates with cert_id |
| `notifications` | System notifications (table exists, UI not yet built) |

### Critical Columns

**`profiles`**
```sql
id           uuid references auth.users PRIMARY KEY
name         text
email        text
phone        text
organization text
designation  text
role         text  -- 'trainee' | 'corporate' | 'government' | 'trainer' | 'admin'
created_at   timestamptz
```

**`courses`** (snake_case — mapped to camelCase in frontend via mapCourse())
```sql
id           serial PRIMARY KEY
title        text
subtitle     text
duration     text
fee_inr      integer    -- maps to Course.fee in TypeScript
fee_usd      integer    -- maps to Course.feeUsd
hours        text       -- e.g. '150 Hrs'
seats        integer
filled       integer
mode         text       -- 'Online' | 'Offline' | 'Hybrid'
start_date   text       -- maps to Course.startDate
badge        text
module_count integer    -- maps to Course.modules
trainer      text
category     text
color        text
icon         text
topics       text[]
logo_url     text       -- optional: path to course logo PNG (e.g. '/course-logos/cewm.png')
                        -- PENDING: column not yet added to Supabase; frontend uses COURSE_LOGO_MAP fallback
```

> ⚠️ **`logo_url` column is NOT yet in Supabase.** Run this SQL to add it:
> ```sql
> ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_url text;
> UPDATE courses SET logo_url = '/course-logos/cewm.png' WHERE id = 1;
> ```
> Until then, `CoursesScreen.tsx` uses `COURSE_LOGO_MAP` as a frontend fallback (keyed by course `id`).

**`registrations`**
```sql
id                  uuid PRIMARY KEY  -- this UUID is used as registration_id in useEnrollment hook
user_id             uuid references profiles(id)
course_id           integer references courses(id)
batch_id            integer references batches(id)
payment_status      text  -- 'pending' | 'paid' | 'failed' | 'refunded'
payment_id          text  -- Razorpay payment ID
razorpay_order_id   text
razorpay_signature  text
registration_id     text  -- e.g. 'AIWMR-2026-0001' (human-readable code)
access_granted      boolean default false  -- SET TO TRUE after payment verified
qr_code             text
created_at          timestamptz
```

> ⚠️ **CRITICAL:** `useEnrollment` queries `.eq('access_granted', true)` — students ONLY unlock
> Learning/Attendance/Certificate screens once this is `true`. Until Razorpay is integrated,
> admin must manually set this in Supabase dashboard for each paid student.

**`modules`**
```sql
id             serial PRIMARY KEY
course_id      integer references courses(id)
title          text
type           text  -- 'video' | 'pdf' | 'quiz' | 'assignment'
duration_label text  -- e.g. '45 min'
duration_mins  integer
order_index    integer
video_url      text  -- Supabase Storage URL
pdf_url        text  -- Supabase Storage URL
description    text
```

**`attendance`**
```sql
id              uuid PRIMARY KEY
registration_id uuid references registrations(id)  -- NOTE: UUID, not the text code
session_date    date
marked_at       timestamptz
UNIQUE(registration_id, session_date)
```

**`certificates`**
```sql
id              uuid PRIMARY KEY
registration_id uuid references registrations(id)
cert_id         text  -- e.g. 'AIWMR-CERT-2026-0042'
issued_at       timestamptz
pdf_url         text  -- Supabase Storage URL (optional)
```

### Triggers

1. **`handle_new_user`** — Auto-creates `profiles` row on `auth.users` insert, pulls `name` and `phone` from `raw_user_meta_data`
2. **`set_registration_id`** — Auto-generates `registration_id` like `AIWMR-2026-0001`
3. **`set_cert_id`** — Auto-generates `cert_id` like `AIWMR-CERT-2026-0042`

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- Students can only read/write **their own** rows (all filtered by `auth.uid()`)
- `courses`, `modules`, `batches`, `session_qr_codes` are **public read** (no auth required)
- `profiles`: own row read/update + admins read all
- `registrations`: `user_id = auth.uid()` for select + insert
- `attendance`: must own the `registration_id`
- `certificates`: must own the `registration_id`

---

## 6. Authentication Architecture

### Current State: REAL AUTH ACTIVE

`AuthContext.tsx` uses real Supabase auth. No demo toggles needed in normal operation.

### Auth Flow

```
App load
  → supabase.auth.getSession()
      → session exists → loadProfile(userId) → setUser({...from profiles table...})
      → no session → setLoading(false) → show LoginScreen

User registers (RegisterScreen)
  → supabase.auth.signUp({ email, password, options: { data: { name, phone } } })
  → Trigger handle_new_user auto-creates profiles row from raw_user_meta_data
  → If org/designation provided: supabase.from('profiles').update({...}).eq('id', data.user.id)
  → Email verification sent (Supabase default template)
  → Show "Verify Your Email" screen — does NOT auto-login
  → User clicks email link → email verified
  → User comes back and logs in manually

User logs in (LoginScreen)
  → supabase.auth.signInWithPassword({ email, password })
  → onAuthStateChange fires → loadProfile(userId) → setUser(...)
  → App renders HomeScreen

User logs out
  → supabase.auth.signOut() → onAuthStateChange fires → setUser(null)
  → App renders LoginScreen
```

### User Object (TypeScript)

```typescript
interface User {
  id: string;           // Supabase auth UUID
  name: string;         // from profiles.name
  email: string;        // from profiles.email
  phone: string;        // from profiles.phone
  role: UserRole;       // 'trainee' | 'corporate' | 'government' | 'trainer' | 'admin'
  organization?: string;
  designation?: string;
}
```

### Admin Account

- Email: `admin@aiwmr.org`
- UUID: `e9da4f7e-ae28-44c6-b703-9c0d403eda22`
- Role must be `'admin'` in `profiles.role`
- Name: Run this SQL if name is blank:
  ```sql
  UPDATE profiles SET name = 'Dr. Sushanth Gade'
  WHERE id = 'e9da4f7e-ae28-44c6-b703-9c0d403eda22';
  ```
- Admin users skip `useEnrollment` check entirely (`user.role === 'admin'` returns early in the hook)

---

## 7. Key Architecture Patterns

### 7.1 EnrollmentGate Pattern

The single most important pattern in this app. All three student-only screens (Learning, Attendance, Certificates) use it:

```typescript
// In any gated screen:
const { loading: enrollLoading, enrollment } = useEnrollment();

return (
  <EnrollmentGate
    loading={enrollLoading}
    enrolled={!!enrollment}
    icon="📚"
    title="My Learning"
    message="Enroll in a course and complete payment to access this."
    onBrowse={() => onNavigate('courses')}
  >
    {/* Real content — only renders when enrolled=true */}
  </EnrollmentGate>
);
```

**EnrollmentGate states:**
1. `loading=true` → full-screen spinner (cream background)
2. `loading=false, enrolled=false` → lock screen with icon, title, message, "Browse Courses →" button
3. `loading=false, enrolled=true` → renders children (the actual screen)

### 7.2 useEnrollment Hook

```typescript
// src/hooks/useEnrollment.ts
export interface Enrollment {
  registrationId: string;  // UUID from registrations.id (used for ALL DB queries)
  regCode: string;          // Human-readable AIWMR-2026-0001 (from registrations.registration_id)
  courseId: number;
  courseTitle: string;
  courseIcon: string;
  courseColor: string;
  batchTime: string;        // from batches.time_slot
}

// DB Query:
// SELECT id, registration_id, courses(id, title, icon, color), batches(time_slot)
// FROM registrations
// WHERE user_id = auth.uid() AND access_granted = true
// LIMIT 1

// Returns: { loading: boolean, enrollment: Enrollment | null }
// enrollment is null if student has no paid registration
```

### 7.3 mapCourse Function

Supabase returns snake_case column names. The frontend TypeScript interface uses camelCase.
Every screen fetching courses must use this mapper:

```typescript
// In CoursesScreen.tsx — copy this pattern wherever courses are fetched
// COURSE_LOGO_MAP is a frontend fallback until logo_url column exists in Supabase
const COURSE_LOGO_MAP: Record<number, string> = {
  1: '/course-logos/cewm.png',
  // add more here when client provides logos for other courses
};

function mapCourse(row: any): Course {
  return {
    id: row.id, title: row.title, subtitle: row.subtitle,
    duration: row.duration, fee: row.fee_inr, feeUsd: row.fee_usd,
    hours: row.hours, seats: row.seats, filled: row.filled,
    mode: row.mode, startDate: row.start_date, badge: row.badge,
    modules: row.module_count, trainer: row.trainer, category: row.category,
    color: row.color, icon: row.icon, topics: row.topics ?? [],
    // Prefer DB value; fall back to local map until logo_url column exists in Supabase
    logoUrl: row.logo_url ?? COURSE_LOGO_MAP[row.id as number] ?? undefined,
  };
}
```

> ⚠️ If you add a new column to `courses` table: update the `Course` interface in `types/index.ts` AND `mapCourse()` in every screen that uses it.
> When `logo_url` column is added to Supabase, `row.logo_url` takes precedence automatically — `COURSE_LOGO_MAP` is the fallback only.

### 7.4 HomeScreen — 3 States

`HomeScreen.tsx` renders one of three sub-components based on user role + enrollment:

```
user.role === 'admin'
  → <AdminHome> — fetches stats from profiles + registrations

else (student):
  → fetch registrations WHERE user_id = user.id AND payment_status = 'paid'
  → has enrollment → <EnrolledHome> — real course data, progress, attendance
  → no enrollment  → <NotEnrolledHome> — "Start Your Journey" + Browse Courses button
```

**AdminHome fetches:**
- `profiles` count where `role = 'trainee'`
- Last 5 `registrations` joined with `profiles(name)` and `courses(title, fee_inr)`
- Calculates revenue from paid registrations

**EnrolledHome fetches:**
- `registrations` with `courses(*)` + `batches(*)` join
- `user_progress` completed count
- `attendance` count for the registration

**NotEnrolledHome:** No DB fetch — static UI only.

---

## 8. Screen-by-Screen Reference

### SplashScreen
- 2-second animated splash with AIWMR logo
- Auto-calls `onDone()` after 2 seconds
- No props besides `onDone`

### LoginScreen
- Email + password form
- Demo mode: pre-fills credentials, accepts anything, auto-logs in
- Real mode: `supabase.auth.signInWithPassword`
- "Create Account" link calls `onShowRegister()` prop
- **AIWMR logo** shown at top of the cream form card: `<img src="/logo.png" style={{ width:'78%', maxWidth:320 }}/>`
- Logo PNG has a transparent background — no `mix-blend-mode` needed, works in all browsers

### RegisterScreen
- Fields: Name*, Email*, Phone*, Organization (optional), Designation (optional), Password*, Confirm Password*
- Calls `supabase.auth.signUp()` with `options: { data: { name, phone } }`
- DB trigger `handle_new_user` auto-creates `profiles` row
- Optional org/designation: updates `profiles` via separate `.update()` call
- On success: shows "Verify Your Email" screen (does NOT auto-login)
- Email verification is intentionally ON (business decision: prevents dummy accounts, enables future communication)

### HomeScreen
See Section 7.4 above.

### CoursesScreen
- Fetches: `supabase.from('courses').select('*').order('id')`
- Uses `mapCourse()` to convert snake_case → camelCase
- Filter tabs: All / Online / Hybrid
- Shows Spinner while loading
- **Fallback:** if Supabase returns 0 rows, falls back to `COURSES` from `data/index.ts`
- Tapping course → `onNavigate('courseDetail', courseObject)`
- **Course logos:** if `course.logoUrl` is set, thumbnail shows logo on white background; otherwise shows emoji on `course.color`
- `COURSE_LOGO_MAP` in the file provides the fallback until `logo_url` column exists in Supabase (see Section 7.3)
- Badges (`CERT`, level) have `zIndex:3` and `whiteSpace:'nowrap'` to stay visible over logo images

### CourseDetailScreen
- Props: `{ course: Course, onBack: () => void, onNavigate: (screen: string) => void }`
- 3 tabs: Overview, Curriculum, Trainer
- **Curriculum tab is gated:**
  - First 3 topics shown to all logged-in users (preview)
  - Remaining topics hidden behind a blurred overlay with lock icon
  - Overlay shows "X more topics — Enroll in this course to unlock the full curriculum" + "Enroll Now · ₹XX,XXX" button (opens registration sheet directly)
  - Enrolled students (`access_granted = true` OR just paid in this session) see all topics
- Registration modal: 3-step flow
  1. Personal Details — **pre-filled from logged-in user** (name/email/phone/org/designation)
  2. Batch Selection — **fetched live from Supabase `batches` table** (falls back to local mock if empty); stores `selectedBatchId`
  3. Payment — **real Razorpay integration** ✅
- **Payment flow (Step 3):**
  1. `handlePay()` calls Edge Function `create-razorpay-order` → gets real Razorpay `order_id`
  2. Opens Razorpay checkout modal (`window.Razorpay`) — handles UPI/Card/Net Banking internally
  3. On success: inserts into `registrations` with `access_granted: true` → unlocks Learning/Attendance/Certs immediately
  4. Shows success banner with real `AIWMR-2026-XXXX` reg code from DB
- **Fallback:** if `VITE_RAZORPAY_KEY_ID` not set → shows "Contact us" card with email/phone instead of pay button
- **Error handling:** Edge Function failure, DB write failure (shows payment ID for manual recovery)
- **Course logo in Overview tab:** if `course.logoUrl` set, renders `<img src={course.logoUrl}/>` with transparent PNG — no `mix-blend-mode` needed
- **Pre-course instructions:** `<PreCourseInstructionsModal userId={user?.id ?? 'guest'}/>` rendered at bottom of screen — appears 600ms after first visit, dismissed permanently via `localStorage` key `aiwmr_instructions_seen_<userId>` (once per user across all courses, not once per course)

### LearningScreen
- **GATED** — requires `access_granted = true` in registrations
- Fetches in parallel:
  1. `modules` WHERE `course_id = enrollment.courseId` ORDER BY `order_index`
  2. `user_progress` WHERE `user_id = user.id` → maps `module_id → status`
  3. `attendance` count WHERE `registration_id = enrollment.registrationId`
- Module status from DB: `locked` | `in-progress` | `completed`
- Expandable module cards on click
- "Open Module" button present but **not wired to video/PDF viewer yet**

### AdminSessionScreen
- **Admin only** — reached via 🔐 Session QR button in AdminHome quick actions
- Props: `{ onBack: () => void }`
- **Generate session:**
  - Select course (dropdown from Supabase) → select batch → select duration (1/2/3/4 hrs)
  - Tap "Generate" → random 6-char code (e.g. `K7NP3A`) stored in `session_qr_codes` with expiry timestamp
  - Code chars exclude confusable characters (no 0/O, 1/I/L)
- **Display:**
  - Shows `QRCodeSVG` (200px, from `qrcode.react`) encoding the 6-char code
  - Shows the text code in large monospace font (for students who can't scan)
  - "Copy" button copies code to clipboard
  - Countdown: `Xh Ym left` until expiry
- **Today's sessions list:**
  - All sessions generated today shown at top
  - Each shows course, batch, code, time remaining
  - "Show QR" — re-displays the QR card
  - "End" — immediately expires the session (sets `expires_at = now()`)
- Countdown auto-refreshes every 30 seconds

### AttendanceScreen
- **GATED** — requires `access_granted = true`
- Fetches in parallel:
  - `attendance` WHERE `registration_id = enrollment.registrationId` → set of attended dates
  - `session_qr_codes` WHERE `course_id = enrollment.courseId` → set of all scheduled session dates
- **Two input modes (tabs):**
  - **📷 Scan QR** — opens rear camera via `react-qr-reader`, auto-detects QR code, prevents double-fire with ref lock
  - **✏️ Enter Code** — 6-char text input (auto-uppercase), submit button enabled at 6 chars
- **Validation flow (both modes use same path):**
  1. Query `session_qr_codes` WHERE `qr_code = code`
  2. If not found → Invalid Code state
  3. If `expires_at <= now()` → Invalid Code state (expired)
  4. If today already in `attendedDates` → Already Marked state
  5. Insert into `attendance` table
  6. If DB error code `23505` (unique constraint) → Already Marked
  7. On success → Success state + refresh data
- **4 result states:** success ✅ / already marked 📋 / invalid/expired code ⛔ / error ❌
- **Monthly calendar:**
  - Proper month grid with Sun–Sat day headers
  - Navigate backwards through months (← →), cannot go past current month
  - 5 cell colours: green (present), red-tint (missed = session scheduled but not attended), mist (no session that day), amber (today), sand (upcoming)
  - "Missed" only shows red for days that actually had a `session_qr_codes` entry — not all past days
- **Stats bar:** Attended · Rate (%) · Missed · Scheduled
  - Attendance % = attended / past scheduled sessions (not rolling window)
  - Shows `—` if no sessions scheduled yet
  - Below 75% warning banner inside calendar card
  - "No sessions scheduled yet" message if `pastScheduled === 0`

### CertificateScreen
- **GATED** — requires `access_granted = true`
- Fetches: `certificates WHERE registration_id = enrollment.registrationId` (maybeSingle)
- **If certificate exists:** Shows certificate card with real cert_id, issued date, user's name from `useAuth()`
  - Download: if `pdf_url` → opens URL; else → generates printable HTML + triggers print dialog
  - Share: Web Share API or clipboard fallback
- **If no certificate:** Shows "Keep Going! Complete all modules" + "Continue Learning →" button
- Cert is never auto-issued — must be inserted manually by admin until automation is built

---

## 9. All 15 AIWMR Courses

| # | Title | Code | Duration | INR | USD | Hours | Category |
|---|---|---|---|---|---|---|---|
| 1 | Certificate in Environment & Waste Management | CEWM | 5 Months | ₹16,000 | $175 | 150 Hrs | Environment |
| 2 | Integrated Solid Waste Management | ISWM | Short Term | ₹6,500 | $75 | 60 Hrs | Environment |
| 3 | Bio Medical Waste Management | BMWM | Short Term | ₹6,500 | $75 | 60 Hrs | Health |
| 4 | Industrial Waste Management | IWM | Short Term | ₹6,500 | $75 | 60 Hrs | Industrial |
| 5 | Circular Economy & EPR | CE & EPR | Short Term | ₹8,000 | $85 | 75 Hrs | Policy |
| 6 | Landfill Management | LFM | Short Term | ₹8,000 | $85 | 75 Hrs | Industrial |
| 7 | E-Waste Management | EWM | Short Term | ₹8,000 | $85 | 75 Hrs | Industrial |
| 8 | Organic Waste Management | OWM | Short Term | ₹8,000 | $85 | 75 Hrs | Environment |
| 9 | Transfer Station Management | TSM | Short Term | ₹8,000 | $85 | 75 Hrs | Industrial |
| 10 | Waste to Energy | W2E | Short Term | ₹10,000 | $100 | 100 Hrs | Energy |
| 11 | Hazardous Waste Management | HWM | Short Term | ₹10,000 | $100 | 100 Hrs | Industrial |
| 12 | Waste Characterization & Audits | WCA | Short Term | ₹5,000 | $50 | 40 Hrs | Environment |
| 13 | ESG — Environmental, Social & Governance | ESG | Short Term | ₹8,000 | $85 | 75 Hrs | Compliance |
| 14 | Sustainable Consumption & Production | SCP | Short Term | ₹5,000 | $50 | 40 Hrs | Sustainability |
| 15 | Environmental Management & Legal Compliance | EMLC | Short Term | ₹5,000 | $50 | 40 Hrs | Compliance |

**Trainer for all courses:** Dr. Sushanth Gade | **All modes:** Online

These 15 courses exist in BOTH Supabase AND `src/data/index.ts` (as local fallback).

---

## 10. Implementation Status

### ✅ FULLY IMPLEMENTED

- PWA setup (vite-plugin-pwa, service worker, manifest, installable on Android/iOS)
- Custom app icons — `purpose: "any"` (NOT maskable — prevents circular cropping on Android)
- Full-viewport layout, safe area insets for notched phones
- Supabase client with graceful demo mode fallback
- **Real Supabase authentication** — signUp, signInWithPassword, signOut, session persistence
- Email verification flow (intentionally ON)
- `handle_new_user` DB trigger — auto-creates profiles on signup
- RegisterScreen with full validation + optional org/designation
- LoginScreen
- HomeScreen — 3 states: Admin dashboard / Enrolled student / Not-enrolled student
- Admin dashboard with real stats (student count, revenue, recent registrations)
- Time-based greetings (Morning/Afternoon/Evening/Night + emoji)
- CoursesScreen — real Supabase fetch + `mapCourse()` + local fallback
- CourseDetailScreen — 3-tab layout + 3-step registration modal + **real Razorpay payment** ✅
- All 15 AIWMR courses — in Supabase AND `data/index.ts`
- `useEnrollment` hook — checks `access_granted = true`
- `EnrollmentGate` component — reusable gating pattern
- LearningScreen — gated, real module list from DB, real progress status
- AttendanceScreen — gated, real QR camera scanner + manual code entry, monthly calendar, real DB writes
- CertificateScreen — gated, real certificate data, "keep going" state when no cert
- Certificate download (PDF URL or HTML print fallback) + Web Share API
- TypeScript strict mode — **zero errors**
- AdminSessionScreen — admin generates session QR codes, displays QR + 6-char text code, manages live sessions
- AttendanceScreen — gated, real QR camera scanner + manual code entry, monthly calendar, real DB writes, validated against `session_qr_codes`
- Curriculum gating in CourseDetailScreen — first 3 topics free, rest locked behind enrollment
- Vercel deployment — auto-deploys on git push
- `react-qr-reader` installed (camera scanning)
- `qrcode.react` installed (QR code display for admin)
- **Razorpay payment integration** — Edge Function deployed, test keys active, real `registrations` insert on payment success
- **AIWMR brand logo** on LoginScreen (`public/logo.png` — transparent PNG, 600×245)
- **PWA app icons** — all generated from AIWMR logo.jpeg via `scripts/generate-icons.mjs` using `sharp`
- **CEWM course logo** in CoursesScreen thumbnail + CourseDetailScreen Overview tab (`public/course-logos/cewm.png` — transparent PNG, 600×400)
- **PWA install banner** (`InstallBanner.tsx`) — bottom sheet for Android (native prompt OR manual 3-dot instructions) + iOS (Share → Add to Home Screen), shown after 1.5s on mobile, dismissed per session via `sessionStorage`
- **Pre-course instructions modal** (`PreCourseInstructionsModal.tsx`) — 12-item "Before You Begin" bottom sheet on CourseDetailScreen, shown once per user permanently via `localStorage`

### 🔧 PENDING (in priority order)

#### P1 — Critical for Real Usage

1. **Add Vercel env vars** — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + `VITE_RAZORPAY_KEY_ID` in Vercel dashboard → Settings → Environment Variables → Production → Redeploy

2. **Set admin name in DB:**
   ```sql
   UPDATE profiles SET name = 'Dr. Sushanth Gade'
   WHERE id = 'e9da4f7e-ae28-44c6-b703-9c0d403eda22';
   ```

3. **Swap Razorpay test keys → live keys** when client's Razorpay account is KYC verified:
   - Replace `VITE_RAZORPAY_KEY_ID` in `.env` and Vercel with `rzp_live_*`
   - Run `supabase secrets set RAZORPAY_KEY_ID=rzp_live_*` + `supabase secrets set RAZORPAY_KEY_SECRET=<live_secret>`
   - Redeploy Edge Function: `npx supabase functions deploy create-razorpay-order --no-verify-jwt`

4. **Server-side Razorpay signature verification** — currently skipped; should verify `razorpay_signature` in the Edge Function before trusting payment success

#### P2 — Core Feature Completion

4. **Video/PDF Module Viewer** — "Open Module" button in LearningScreen is unconnected
   - Videos: Supabase Storage signed URLs or YouTube/Vimeo embed
   - PDFs: open in iframe or new tab
   - Update `user_progress`: `in-progress` when opened, `completed` when finished

5. **Certificate auto-issuance** — Currently admin must manually insert certificates
   - Trigger: when all `user_progress` for a course are `completed`
   - Could be a Supabase Edge Function or DB trigger

#### P3 — Admin Panel

6. **Full Admin Panel** — Admin currently has: stats dashboard + 🔐 Session QR manager. Still needs:
   - Student list with enrollment status + manual `access_granted` toggle (for bank transfer / offline payments)
   - Manual certificate issuance UI
   - Course + module CRUD (upload videos/PDFs to Supabase Storage)
   - Batch management

7. **Admin route protection** — Admin can currently navigate to student screens via bottom nav

#### P4 — Enhancements

8. **PDF Certificate generation** — Use `@react-pdf/renderer` for proper printable certificate

9. **Offline UI** — Show "You're offline" banner when `navigator.onLine` is false

10. **Notifications** — `notifications` table exists in DB, no UI built

11. **Assessment/Quiz system** — `questions` + `assessment_attempts` tables in DB, no frontend (see Section 22 for confirmed grading rules)

12. **Student topic-level analytics** — `student_topic_scores` table in DB, no frontend

13. **Module unlock logic** — Currently all modules start `locked`; no business logic for sequential unlocking

---

## 11. CSS Variables & Design System

```css
--forest:   #1a3a2a   /* Primary brand — dark green headers, buttons */
--pine:     #2d5a3d   /* Secondary green */
--moss:     #4a7c59   /* Medium green */
--leaf:     #6aad78   /* Success, completed state, progress bars */
--sage:     #a8c5b0   /* Muted green text on dark backgrounds */
--cream:    #f7f3ec   /* App background */
--sand:     #e8dfc8   /* Card borders, dividers, locked state bg */
--earth:    #8b6f47   /* Brown accent */
--amber:    #d4943a   /* Warning, scanning state, today highlight */
--charcoal: #2c2c2c   /* Primary text color */
--mist:     #f0ede6   /* Light card backgrounds (expanded sections) */
--white:    #ffffff
--red:      #c0392b   /* Errors, absent days in calendar */
--gold:     #c9a84c   /* Certificate accents */
```

**Typography:**
- Headings: `'Playfair Display', serif` (Google Font — loaded in index.css @import)
- Body/UI: `'DM Sans', sans-serif` (Google Font)
- Always specify `fontFamily` inline — no global typography resets

**Safe Area Insets (notched phones):**
```css
--safe-top:    env(safe-area-inset-top,    0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
```

**PWA Layout (CRITICAL — do not break these):**
```css
html, body, #root { height: 100%; overflow: hidden; }
#root { display: flex; flex-direction: column; position: fixed; inset: 0; }
.screen { flex: 1; overflow-y: auto; padding-bottom: calc(72px + var(--safe-bottom)); padding-top: var(--safe-top); }
.bottom-nav { flex-shrink: 0; padding-bottom: var(--safe-bottom); }
```

**Animations defined in `index.css`:** `fadeUp`, `pulse`, `spin`, `scanLine`, `slideUp`

---

## 12. Brand Assets & Image Generation

### Source Images

All source images live in `C:\Users\Ashok\source\repos\aiwmr-app-pwa\Client images\` (outside the repo — not committed to git):
- `aiwmr logo.jpeg` — main AIWMR brand logo (used for app icons + login screen logo)
- `CEWM flagship course logo.jpeg` — CEWM course logo (used in course thumbnail + detail)

### Generated Output Files

All PNGs are committed to `public/` and deployed to Vercel:

| Script | Output | Size | Purpose |
|---|---|---|---|
| `scripts/generate-logo.mjs` | `public/logo.png` | 600×245, transparent bg | Login screen logo |
| `scripts/generate-course-logos.mjs` | `public/course-logos/cewm.png` | 600×400, transparent bg | CEWM course thumbnail + detail |
| `scripts/generate-icons.mjs` | `public/icons/*` | 192×192, 512×512, 180×180 | PWA app icons (white bg — opaque, intentional) |

### White Background Removal — CRITICAL PATTERN

Course logos and the brand logo on the login screen must have **transparent backgrounds** so they look clean on any background colour (cream, white, coloured cards). The source JPEGs have white backgrounds baked in.

**Do NOT use `mix-blend-mode: multiply` in CSS.** It is inconsistent across mobile browsers (fails on Comet, older Chrome WebViews).

**The correct approach** (used in both `generate-logo.mjs` and `generate-course-logos.mjs`):

```javascript
// Pixel-level white removal using sharp
const { data, info } = await sharp(srcFile)
  .resize({ width: targetWidth, fit: 'inside' })
  .ensureAlpha()       // adds alpha channel to JPEG
  .raw()               // get raw RGBA pixel buffer
  .toBuffer({ resolveWithObject: true });

const THRESHOLD = 240; // pixels with R,G,B all >= 240 → transparent
const pixels = new Uint8ClampedArray(data.buffer);
for (let i = 0; i < pixels.length; i += 4) {
  if (pixels[i] >= THRESHOLD && pixels[i+1] >= THRESHOLD && pixels[i+2] >= THRESHOLD) {
    pixels[i + 3] = 0; // set alpha to 0 (fully transparent)
  }
}

await sharp(Buffer.from(pixels.buffer), { raw: { width, height, channels } })
  .png()
  .toFile(outFile);
```

**PWA icons** (`generate-icons.mjs`) intentionally keep the white background — they need an opaque background for the home screen icon.

### Adding a New Course Logo

When client provides a new course logo:

1. Copy the image to `Client images/` folder (outside repo)
2. Add an entry in `scripts/generate-course-logos.mjs`:
   ```javascript
   await generateCourseLogo(`${CLIENT}/ISWM logo.jpeg`, `${OUT_DIR}/iswm.png`);
   ```
3. Run: `node scripts/generate-course-logos.mjs`
4. Add to `COURSE_LOGO_MAP` in `CoursesScreen.tsx`:
   ```typescript
   const COURSE_LOGO_MAP: Record<number, string> = {
     1: '/course-logos/cewm.png',
     2: '/course-logos/iswm.png',  // add here
   };
   ```
5. Add `logoUrl` to the course in `src/data/index.ts`
6. Commit + push → Vercel auto-deploys

Once `logo_url` column is added to Supabase, also run the SQL update and the frontend fallback map becomes redundant (but harmless to keep).

---

## 13. Navigation Architecture — App.tsx Routing

```typescript
// App.tsx
type ScreenId = 'home' | 'courses' | 'courseDetail' | 'learning' | 'attendance' | 'certificates' | 'adminSession';
interface NavState { screen: ScreenId; data?: Course; }

const navigate = (screen: string, data?: unknown) =>
  setNav({ screen: screen as ScreenId, data: data as Course | undefined });

// Active tab: courseDetail highlights 'courses' tab
const activeTab = nav.screen === 'courseDetail' ? 'courses' : nav.screen;
```

**Auth routing (before main nav renders):**
```typescript
if (splash)   return <SplashScreen onDone={...}/>;
if (loading)  return <FullscreenSpinner/>;         // checking Supabase session
if (!user)    return authScreen === 'register'
                ? <RegisterScreen onShowLogin={...}/>
                : <LoginScreen onShowRegister={...}/>;
// user is logged in → render main app with BottomNav
```

**All screens receive `onNavigate`:**
```typescript
case 'learning':      return <LearningScreen onNavigate={navigate}/>;
case 'attendance':    return <AttendanceScreen onNavigate={navigate}/>;
case 'certificates':  return <CertificateScreen onNavigate={navigate}/>;
case 'adminSession':  return <AdminSessionScreen onBack={() => navigate('home')}/>;
```

**AdminSessionScreen** has no `onNavigate` — it only has `onBack` (always returns to home).
`adminSession` does NOT appear in the BottomNav — it is reached only via the admin quick actions card.

---

## 14. Razorpay Integration — ✅ IMPLEMENTED

### Step 1: Supabase Edge Function

```bash
supabase functions new create-razorpay-order
```

`supabase/functions/create-razorpay-order/index.ts`:
```typescript
import Razorpay from 'npm:razorpay@2.9.2';

const rzp = new Razorpay({
  key_id:     Deno.env.get('RAZORPAY_KEY_ID')!,
  key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
});

Deno.serve(async (req) => {
  const { amount } = await req.json();
  const order = await rzp.orders.create({
    amount, currency: 'INR', receipt: `order_${Date.now()}`,
  });
  return new Response(JSON.stringify(order), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Deploy:
```bash
supabase functions deploy create-razorpay-order \
  --no-verify-jwt \
  --secret RAZORPAY_KEY_ID=rzp_test_xxxx \
  --secret RAZORPAY_KEY_SECRET=your_secret_key
```

### Step 2: Replace handlePay in CourseDetailScreen (~line 29)

```typescript
const handlePay = async () => {
  setPaying(true);

  const gst = Math.round(course.fee * 0.18);

  // 1. Create order via Edge Function
  const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount: (course.fee + gst) * 100 }  // paise
  });
  if (error || !order) { setPaying(false); return; }

  // 2. Open Razorpay modal
  const { openRazorpay } = await import('../lib/razorpay');
  openRazorpay({
    orderId:    order.id,
    amount:     order.amount,
    courseName: course.title,
    name:       form.name,
    email:      form.email,
    phone:      form.phone,
    onSuccess: async (response) => {
      // 3. Save registration — access_granted:true unlocks all gated screens immediately
      const { error: regError } = await supabase.from('registrations').insert({
        user_id:            user!.id,
        course_id:          course.id,
        batch_id:           selectedBatchId,
        payment_status:     'paid',
        payment_id:         response.razorpay_payment_id,
        razorpay_order_id:  response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        access_granted:     true,
      });
      if (!regError) { setEnrolled(true); setShowReg(false); }
      setPaying(false);
    },
    onDismiss: () => setPaying(false),
  });
};
```

### Step 3: Add Razorpay script to index.html

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 15. QR Attendance Integration — ✅ IMPLEMENTED

Both packages are installed: `react-qr-reader` (scanning) + `qrcode.react` (display).

### How it works (implemented)

**Admin flow — `AdminSessionScreen`:**
1. Admin selects course + batch + duration (1–4 hrs)
2. Taps "Generate Session QR" → random 6-char code inserted into `session_qr_codes` with `expires_at`
3. App renders `<QRCodeSVG value={code} size={200}/>` (from `qrcode.react`) — admin shares on projector/screenshare
4. Large monospace text code shown below QR for students who can't scan camera
5. "End" button immediately expires the session

**Student flow — `AttendanceScreen` (two modes):**

Mode 1 — Camera scan:
```typescript
<QrReader
  onResult={(result) => { if (result) markAttendance(result?.text ?? result?.getText?.()); }}
  constraints={{ facingMode: 'environment' }}
/>
```

Mode 2 — Manual code entry:
- 6-char input (auto-uppercase), submit button enabled at length 6

Both modes call `markAttendance(code)`:
```typescript
const markAttendance = async (code: string) => {
  // 1. Validate code exists + not expired
  const { data: session } = await supabase
    .from('session_qr_codes')
    .select('id, session_date, expires_at')
    .eq('qr_code', code.trim().toUpperCase())
    .single();

  if (!session || new Date(session.expires_at) <= new Date()) { setScanState('invalid'); return; }

  // 2. Insert attendance (unique constraint prevents duplicates)
  const { error } = await supabase.from('attendance').insert({
    registration_id: enrollment.registrationId,
    session_date:    session.session_date,
  });

  if (!error)                  setScanState('success');
  else if (error.code === '23505') setScanState('already'); // duplicate
  else                         setScanState('error');
};
```

### Session code format

- 6 characters, uppercase alphanumeric
- Excludes confusable characters: no 0/O, 1/I/L
- Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Example: `K7NP3A`
- QR code contains the plain 6-char code as its value

---

## 16. PWA Configuration

### Icon Requirements (CRITICAL)

Icons must be in `public/icons/` with these exact names:
- `android-chrome-192x192.png` (192×192 px)
- `android-chrome-512x512.png` (512×512 px)
- `apple-touch-icon.png` (180×180 px)
- `favicon.ico`

**CRITICAL:** In `vite.config.ts` and `public/manifest.json`, icon purpose MUST be `"any"` — NEVER `"maskable"` or `"any maskable"`. Maskable applies a circular crop on Android that cuts off corners of the AIWMR logo.

### Manifest Key Settings (`public/manifest.json`)

```json
{
  "name": "AIWMR Training Academy",
  "short_name": "AIWMR",
  "display": "standalone",
  "theme_color": "#1a3a2a",
  "background_color": "#1a3a2a",
  "start_url": "/"
}
```

### PWA Install Behavior

`InstallBanner.tsx` is a bottom sheet modal. It shows automatically after 1.5 seconds on any mobile device. Dismissed state is stored in `sessionStorage` key `aiwmr_install_seen` — reappears on next browser session (not on page reload).

**The banner renders in `App.tsx` on the login screen (before login), not only after login.**

Three sub-components inside `InstallBanner.tsx`:

| Component | When shown | Content |
|---|---|---|
| `AndroidInstallSheet` | Android + `canInstall=true` (browser fired `beforeinstallprompt`) | "Install App" button that calls `prompt()` |
| `AndroidManualSheet` | Android + `canInstall=false` (no native prompt — common on first visit) | Step-by-step: tap ⋮ → "Add to Home Screen" → "Install" |
| `IOSSheet` | iOS (detected via `navigator.userAgent`) | Step-by-step: tap Share → "Add to Home Screen" → "Add" |

> ⚠️ `beforeinstallprompt` does NOT fire on every Android visit. Chrome requires: HTTPS + service worker + manifest + no existing install + user has visited enough times. The `AndroidManualSheet` is the reliable fallback for first-time visitors.

> ⚠️ The manual instruction says tap **"Install"** (not "Add") — Chrome on Android shows "Install" as the final button label.

**`usePWAInstall.ts` hook:**
- Listens for `beforeinstallprompt` — stores the event reference
- Exposes `canInstall: boolean` and `triggerInstall: () => void`
- `canInstall` is `false` until the browser fires the event (often never on first visit)

### Testing PWA Install

1. `npm run build && npm run preview` (must be production build — service worker only registers in prod)
2. Open Chrome DevTools → Application → Manifest (check no errors)
3. Open on real Android phone via Vercel URL (HTTPS required for service worker)
4. Banner appears after 1.5 seconds — shows manual instructions on first visit
5. After multiple visits, Chrome may fire `beforeinstallprompt` → "Install App" button appears instead

---

## 17. Full Database Setup SQL

Run in Supabase SQL Editor (safe to re-run — uses `if not exists`):

```sql
-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid references auth.users primary key,
  name         text,
  email        text,
  phone        text,
  organization text,
  designation  text,
  role         text default 'trainee'
               check (role in ('trainee','corporate','government','trainer','admin')),
  created_at   timestamptz default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, phone)
  values (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Courses ───────────────────────────────────────────────────────────────────
create table if not exists courses (
  id           serial primary key,
  title        text not null,
  subtitle     text,
  duration     text,
  fee_inr      integer not null,
  fee_usd      integer,
  hours        text,
  seats        integer default 20,
  filled       integer default 0,
  mode         text check (mode in ('Online','Offline','Hybrid')),
  start_date   text,
  badge        text,
  module_count integer default 0,
  trainer      text,
  category     text,
  color        text,
  icon         text,
  topics       text[],
  created_at   timestamptz default now()
);

-- ── Batches ───────────────────────────────────────────────────────────────────
create table if not exists batches (
  id         serial primary key,
  course_id  integer references courses(id) on delete cascade,
  label      text not null,
  date       text,
  time_slot  text,
  seats      integer,
  created_at timestamptz default now()
);

-- ── Registrations ─────────────────────────────────────────────────────────────
create table if not exists registrations (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references profiles(id) on delete cascade,
  course_id           integer references courses(id) on delete cascade,
  batch_id            integer references batches(id),
  payment_status      text default 'pending'
                      check (payment_status in ('pending','paid','failed','refunded')),
  payment_id          text,
  razorpay_order_id   text,
  razorpay_signature  text,
  registration_id     text unique,
  access_granted      boolean default false,
  qr_code             text,
  created_at          timestamptz default now()
);

create or replace function generate_registration_id()
returns trigger as $$
begin
  new.registration_id := 'AIWMR-' || to_char(now(), 'YYYY') || '-'
    || lpad((select coalesce(max(id::text::integer),0)+1 from
             (select row_number() over() as id from registrations) x)::text, 4, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_registration_id on registrations;
create trigger set_registration_id
  before insert on registrations
  for each row execute procedure generate_registration_id();

-- ── Modules ───────────────────────────────────────────────────────────────────
create table if not exists modules (
  id             serial primary key,
  course_id      integer references courses(id) on delete cascade,
  title          text not null,
  type           text check (type in ('video','pdf','quiz','assignment')),
  duration_label text,
  duration_mins  integer,
  order_index    integer,
  video_url      text,
  pdf_url        text,
  description    text,
  created_at     timestamptz default now()
);

-- ── User Progress ─────────────────────────────────────────────────────────────
create table if not exists user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade,
  module_id    integer references modules(id) on delete cascade,
  status       text default 'locked'
               check (status in ('locked','in-progress','completed')),
  completed_at timestamptz,
  updated_at   timestamptz default now(),
  unique(user_id, module_id)
);

-- ── Attendance ────────────────────────────────────────────────────────────────
create table if not exists attendance (
  id              uuid default gen_random_uuid() primary key,
  registration_id uuid references registrations(id) on delete cascade,
  session_date    date not null,
  marked_at       timestamptz default now(),
  unique(registration_id, session_date)
);

-- ── Session QR Codes ──────────────────────────────────────────────────────────
create table if not exists session_qr_codes (
  id           uuid default gen_random_uuid() primary key,
  course_id    integer references courses(id) on delete cascade,
  batch_id     integer references batches(id),
  session_date date not null,
  qr_code      text unique not null,
  expires_at   timestamptz,
  created_at   timestamptz default now()
);

-- ── Certificates ──────────────────────────────────────────────────────────────
create table if not exists certificates (
  id              uuid default gen_random_uuid() primary key,
  registration_id uuid references registrations(id) on delete cascade unique,
  cert_id         text unique not null,
  issued_at       timestamptz default now(),
  pdf_url         text
);

create or replace function generate_cert_id()
returns trigger as $$
begin
  new.cert_id := 'AIWMR-CERT-' || to_char(now(), 'YYYY') || '-'
    || lpad(floor(random()*10000)::text, 4, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_cert_id on certificates;
create trigger set_cert_id
  before insert on certificates
  for each row execute procedure generate_cert_id();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table profiles         enable row level security;
alter table courses          enable row level security;
alter table batches          enable row level security;
alter table modules          enable row level security;
alter table registrations    enable row level security;
alter table user_progress    enable row level security;
alter table attendance       enable row level security;
alter table session_qr_codes enable row level security;
alter table certificates     enable row level security;

-- Public read (no auth needed)
create policy "Public read courses"   on courses          for select using (true);
create policy "Public read batches"   on batches          for select using (true);
create policy "Public read modules"   on modules          for select using (true);
create policy "Public read qr codes"  on session_qr_codes for select using (true);

-- Profiles: own row + admin reads all
create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update  using (auth.uid() = id);
create policy "Admins read all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Registrations
create policy "Users read own registrations"   on registrations for select using (auth.uid() = user_id);
create policy "Users insert own registrations" on registrations for insert with check (auth.uid() = user_id);

-- User progress
create policy "Users manage own progress" on user_progress for all using (auth.uid() = user_id);

-- Attendance
create policy "Users read own attendance" on attendance
  for select using (registration_id in (select id from registrations where user_id = auth.uid()));
create policy "Users insert own attendance" on attendance
  for insert with check (registration_id in (select id from registrations where user_id = auth.uid()));

-- Certificates
create policy "Users read own certificates" on certificates
  for select using (registration_id in (select id from registrations where user_id = auth.uid()));
```

### Seed the 15 Courses (run separately after table creation)

```sql
insert into courses (title,subtitle,duration,fee_inr,fee_usd,hours,seats,mode,start_date,badge,module_count,trainer,category,color,icon,topics) values
('Certificate in Environment & Waste Management','CEWM · Long Term Program','5 Months',16000,175,'150 Hrs',20,'Online','Jul 15, 2026','Flagship',5,'Dr. Sushanth Gade','Environment','#2d5a3d','🌿',ARRAY['Environment Management','Introduction to Waste Management','Solid Waste Streams & Management Hierarchy','Source Segregation & MRF','Waste Collection & Transportation Logistics','Smart & Digital Waste Management','Waste Transfer & Processing Systems','Waste Treatment & Disposal','Recycling, Circular Economy & EPR','IPR & Technology Management in Waste Systems','Organic / Food Waste Management','Industrial / Hazardous Waste Management','Plastics Waste Management','Dumpsite & Landfill Management','Energy Recovery & Waste-to-Energy (WtE)','Waste Processing Technologies','Waste Economics, Finance & Institutional Management','Stakeholder Engagement & Community Participation','Behavioral Change in Waste Management','EH&S in Waste Systems','Waste Conventions, Protocols & International Regulations','Career & Business Prospects in Waste Management','Resource Efficiency and Resource Recovery','Impact of Waste on Biodiversity and the Environment','ESG - Environment, Sustainability & Governance','Climate Change, Carbon Management & Waste Sector Emissions']),
('Integrated Solid Waste Management','ISWM · Short Term','Short Term',6500,75,'60 Hrs',20,'Online','To be announced','New',2,'Dr. Sushanth Gade','Environment','#4a7c59','🗑️',ARRAY['Solid Waste Streams & Classification','Collection & Transportation Systems','Material Recovery Facilities (MRF)','Waste Treatment Technologies','Integrated Waste Planning & Policy','Case Studies & Best Practices']),
('Bio Medical Waste Management','BMWM · Short Term','Short Term',6500,75,'60 Hrs',20,'Online','To be announced','New',2,'Dr. Sushanth Gade','Health','#c0392b','🏥',ARRAY['Classification of Bio Medical Waste','Segregation, Packaging & Labelling','Storage, Collection & Transportation','Treatment & Disposal Methods','Legal & Regulatory Framework','Healthcare Facility Compliance']),
('Industrial Waste Management','IWM · Short Term','Short Term',6500,75,'60 Hrs',20,'Online','To be announced','New',2,'Dr. Sushanth Gade','Industrial','#8b6f47','🏭',ARRAY['Types of Industrial Waste','Waste Characterization & Assessment','Treatment & Disposal Technologies','Pollution Prevention Strategies','Regulatory Compliance & Reporting','Industrial EHS Management']),
('Circular Economy & EPR','CE & EPR · Short Term','Short Term',8000,85,'75 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Policy','#1a6b8a','♻️',ARRAY['Circular Economy Principles','Extended Producer Responsibility (EPR)','Product Life Cycle Analysis','Resource Recovery Strategies','EPR Policy & Regulations in India','Sustainable Business Models']),
('Landfill Management','LFM · Short Term','Short Term',8000,85,'75 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Industrial','#5d4037','🏔️',ARRAY['Landfill Site Selection & Design','Leachate & Gas Management','Environmental Monitoring','Landfill Operations & Safety','Closure & Aftercare','Regulations & Compliance']),
('E-Waste Management','EWM · Short Term','Short Term',8000,85,'75 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Industrial','#1565c0','💻',ARRAY['E-Waste Categories & Hazardous Components','Collection & Dismantling Processes','Refurbishment & Reuse','Recycling Technologies & Smelting','E-Waste Rules & Producer Responsibility','Global E-Waste Trends']),
('Organic Waste Management','OWM · Short Term','Short Term',8000,85,'75 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Environment','#558b2f','🌱',ARRAY['Food & Organic Waste Streams','Composting Technologies','Anaerobic Digestion & Biogas','Vermicomposting','Source Segregation for Organics','Organic Waste Policy & Markets']),
('Transfer Station Management','TSM · Short Term','Short Term',8000,85,'75 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Industrial','#6a1e72','🚚',ARRAY['Transfer Station Design & Layout','Receiving & Compaction Operations','Fleet & Logistics Management','Health, Safety & Environment','Regulatory Requirements','Operational Cost Optimization']),
('Waste to Energy','W2E · Short Term','Short Term',10000,100,'100 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Energy','#e65100','⚡',ARRAY['Waste-to-Energy Technologies Overview','Incineration & Combustion Systems','Refuse Derived Fuel (RDF)','Biogas & Landfill Gas Recovery','Pyrolysis & Gasification','Project Economics & Policy']),
('Hazardous Waste Management','HWM · Short Term','Short Term',10000,100,'100 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Industrial','#b71c1c','⚠️',ARRAY['Hazardous Waste Classification & Identification','Chemical Hazard Assessment','Storage, Handling & Transport','Treatment & Disposal Technologies','Emergency Response & Incident Management','Regulatory Compliance & Reporting']),
('Waste Characterization & Audits','WCA · Short Term','Short Term',5000,50,'40 Hrs',20,'Online','To be announced','New',1,'Dr. Sushanth Gade','Environment','#37474f','📊',ARRAY['Waste Composition Studies','Sampling Methodologies','Laboratory Analysis Techniques','Data Interpretation & Reporting','Waste Audit Planning','Benchmarking & Performance Indicators']),
('ESG — Environmental, Social & Governance','ESG · Short Term','Short Term',8000,85,'75 Hrs',20,'Online','To be announced','New',3,'Dr. Sushanth Gade','Compliance','#1b5e20','🌍',ARRAY['ESG Frameworks & Global Standards','Environmental Reporting & Metrics','Social Impact & Stakeholder Engagement','Governance Structures & Accountability','ESG Ratings & Investor Relations','Sustainability Reporting (GRI, BRSR)']),
('Sustainable Consumption & Production','SCP · Short Term','Short Term',5000,50,'40 Hrs',20,'Online','To be announced','New',2,'Dr. Sushanth Gade','Sustainability','#4527a0','🔄',ARRAY['UN SDG 12 — SCP Framework','Life Cycle Thinking','Green Procurement & Supply Chain','Consumer Behaviour & Demand Management','Eco-Labelling & Certifications','SCP Policy Tools & Case Studies']),
('Environmental Management & Legal Compliance','EMLC · Short Term','Short Term',5000,50,'40 Hrs',20,'Online','To be announced','New',2,'Dr. Sushanth Gade','Compliance','#1a237e','⚖️',ARRAY['Environmental Laws in India','Environmental Impact Assessment (EIA)','Consents, Permits & Authorizations','Environmental Management Systems (ISO 14001)','Corporate Environmental Liability','Compliance Auditing & Reporting']);
```

---

## 18. Quick Start Commands

```bash
npm install               # install all dependencies
cp .env.example .env      # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev               # dev server at http://localhost:3000
npm run typecheck         # must be zero errors before committing
npm run build             # production build to /dist
npm run preview           # test prod build at http://localhost:4173 (needed for PWA testing)
git push                  # auto-deploys to Vercel
```

---

## 19. Known Issues & Gotchas

| Issue | Cause | Fix Applied |
|---|---|---|
| `import.meta.env` TypeScript errors | Missing Vite client types | Added `"types": ["vite/client"]` to `tsconfig.json` |
| App icon circular-cropped on Android | `purpose: "any maskable"` in manifest | Changed to `purpose: "any"` in both `vite.config.ts` and `manifest.json` |
| PWA install never appears | No service worker | Fixed by adding `vite-plugin-pwa` |
| Admin name shows blank | Admin created without name metadata | Run SQL: `UPDATE profiles SET name = 'Dr. Sushanth Gade' WHERE id = 'e9da4f7e...'` |
| HomeScreen always "Good Morning" | Hardcoded string | Fixed: uses `getGreeting()` with `new Date().getHours()` |
| `reg.batches?.label` TypeScript error | Supabase returns join as array type | Cast with `(reg.batches as any)?.label` |
| Student sees Learning/Attendance/Certs before paying | No gating existed | Fixed: `useEnrollment` + `EnrollmentGate` pattern applied to all 3 screens |
| All past calendar days showed red (absent) | Compared against all past days, not just scheduled sessions | Fixed: only marks absent for days that have a `session_qr_codes` entry |
| Attendance % used wrong denominator | Was dividing by rolling 28-day window | Fixed: divides by count of past scheduled sessions from `session_qr_codes` |
| QR scan was mock (no DB write) | Placeholder animation only | Fixed: real insert into `attendance` table + validates against `session_qr_codes` |
| No manual code fallback for attendance | Camera-only approach | Fixed: ✏️ Enter Code tab added — students can type the 6-char code manually |
| Admin had no way to generate attendance QR | No admin tools | Fixed: `AdminSessionScreen` — generates, displays, and manages session QR codes |
| Full curriculum visible to non-enrolled users | No gating on curriculum tab | Fixed: first 3 topics shown free, rest locked with "Enroll Now" overlay |
| Vercel deploy fails on TS errors | Strict TypeScript mode | Run `npm run typecheck` locally first; fix all errors before pushing |
| iOS PWA install prompt not showing | iOS doesn't support `beforeinstallprompt` | Expected behavior — iOS users use Share → Add to Home Screen (instructions shown in IOSSheet) |
| Android install banner never appeared | `canInstall` gated entire banner; `beforeinstallprompt` only fires after multiple visits | Fixed: banner always shows for Android after 1.5s; uses `AndroidManualSheet` as default, `AndroidInstallSheet` when native prompt available |
| PWA install step said "Add" but Chrome shows "Install" | Wrong label in `AndroidManualSheet` | Fixed: step 3 now correctly says "Install" |
| Student enrolled but screens still locked | `access_granted` is still `false` | Fixed with Razorpay integration — `access_granted: true` set on payment success. Manual DB toggle still needed for bank transfer payments |
| Logo/course image showed white rectangular box | JPEG has white bg; `mix-blend-mode:multiply` inconsistent on mobile browsers (Comet etc.) | Fixed: scripts now remove white pixels via alpha-channel threshold (R,G,B >= 240 → transparent). No CSS `mix-blend-mode` needed |
| Course thumbnail badges chopped by logo image | Logo image rendered above badges (z-index not set) | Fixed: badges have `zIndex:3` + `whiteSpace:'nowrap'`; text shortened to "CERT" and "INTER" |
| CEWM logo not showing (from Supabase) | `courses` table has no `logo_url` column yet | Fixed: `COURSE_LOGO_MAP` in `CoursesScreen.tsx` provides frontend fallback keyed by course `id` |

---

## 20. Security Checklist

- ✅ `.env` in `.gitignore` — never committed to git
- ✅ Only Supabase **anon key** in frontend (not service role key — that has admin access)
- ✅ Row Level Security enabled on ALL tables
- ✅ Students can only access their own rows (`auth.uid() = user_id`)
- ✅ Razorpay Key Secret must NEVER be in frontend `.env` — only in Edge Function secrets
- ⚠️ (PENDING) Razorpay signature verification server-side — not yet implemented
- ⚠️ (PENDING) Admin routes not protected — admin can navigate to student screens via bottom nav

---

## 21. DRM / Video Content Protection

**Client's concern:** Prevent students from downloading/copying video content.

**Reality:**
- Widevine DRM works in PWA (Chrome PWA uses Widevine L3 — same as browser)
- **L3** = software-level decryption → protects the stream from direct URL access, but screen recording is still possible
- **L1** = hardware-level → only in native Android apps on certified devices — even then, many budget devices don't support L1 and fall back to L3
- Native apps and PWA are effectively the same protection level for most users

**Recommended approach for AIWMR:**
1. Store videos in **Supabase Storage** with **signed URLs** (expire after 1 hour)
2. Generate signed URL only after verifying `access_granted = true`
3. This prevents: direct link sharing, video downloading via URL
4. Combined with L3 Widevine on a CDN (Cloudflare Stream, AWS CloudFront + MediaConvert): same protection level as Coursera, Udemy, NPTEL

**Conclusion:** Full copy-protection is technically impossible for any software platform. The signed URL approach is the industry standard and is sufficient for AIWMR's needs.

---

## 22. Customer Requirements Summary

### Source
Requirements gathered from: Requirements.docx + WhatsApp conversations with Dr. Sushanth Gade

### Implemented ✅
- Mobile-first PWA installable on Android + iOS
- PWA install banner (Android native prompt + Android manual instructions + iOS Share instructions)
- 15 real AIWMR courses with INR + USD dual pricing
- Student self-registration with email verification
- Admin dashboard with real stats
- Course browsing without enrollment required
- Enrollment gating (Learning/Attendance/Certs locked until paid)
- QR-based attendance — full end-to-end: admin generates session QR, student scans camera OR types code, validated against DB, real attendance written
- 28-day attendance calendar grid
- Certificate viewer with print-to-PDF download
- Module listing with progress status
- **Razorpay payment** ✅ — Edge Function deployed, real orders + registrations, `access_granted: true` on payment success
- AIWMR brand logo on login screen + app icons (all generated from client JPEG via sharp)
- CEWM course logo in course thumbnail + detail page (transparent PNG, no white box)

### Requested but Pending 🔧
- QR scanner ✅ implemented — `react-qr-reader` installed, camera scan + manual code entry both working
- Module video/PDF content viewer
- Admin panel (student management, QR generation, certificate issuance, course CRUD)
- Assessment/quiz system per module (grading rules confirmed — see Section 23)
- Student individual performance dashboard per participant (confirmed requirement)
- Notifications for upcoming live sessions
- Proper PDF certificate generation (`@react-pdf/renderer`)
- International payment (USD — for Oman/overseas students)
- Offline video download for field use

### Not Feasible / Clarified
- Full video DRM (L1 Widevine) — requires native app + certified hardware; L3 (what PWA provides) is industry standard

---

## 23. Assessment & Grading Rules (Confirmed by Dr. Sushanth Gade)

> Source: WhatsApp reply from Dr. Sushanth Gade, April 2026
> Status: **Documented — NOT yet implemented**

### Pass/Fail Thresholds

| Score | Outcome |
|---|---|
| Below 60% | ❌ Fail — must retake assessment |
| 60% – 89% | ✅ Pass — module unlocked, course continues |
| 90% and above | 🏆 Pass + Special Reward (see below) |

### Reward for 90%+

Students scoring 90% or above receive **one of the following** (value addition from AIWMR Institute):
- **Free Internship** opportunity
- **Free Academic Project Report**

> This is intentionally designed as a **marketing differentiator** — to attract students and stand out from competing institutes. It should be prominently displayed on the courses listing and course detail pages as a selling point.

### Per-Participant Performance Dashboard

Each student should have a dedicated performance dashboard showing:
- Score per assessment attempt
- Strong topics vs weak topics (topic-level breakdown)
- Overall course completion percentage
- Attendance percentage
- Certificate eligibility status

Admin should also be able to view this dashboard for any student.

> DB tables `questions`, `assessment_attempts`, and `student_topic_scores` are already in the schema for this. Frontend not yet built.

### Implementation Notes (for when this is built)

1. Each module gets a set of questions in the `questions` table (`module_id`, `question_text`, `options[]`, `correct_index`, `topic_tag`)
2. Student submits answers → insert into `assessment_attempts` (`user_id`, `module_id`, `score_pct`, `passed`, `attempted_at`)
3. Per-topic scoring → insert into `student_topic_scores` (`user_id`, `topic_tag`, `score_pct`)
4. If `score_pct >= 60` → update `user_progress` to `completed`, unlock next module
5. If `score_pct >= 90` → trigger reward notification (flag in `assessment_attempts.reward_earned = true`)
6. Show "You've earned a Free Internship!" banner in the app + email notification to student + alert to admin

---

## 24. Phase 2 Roadmap (Confirmed by Dr. Sushanth Gade)

> Source: WhatsApp reply from Dr. Sushanth Gade, April 2026
> Status: **Documented — Phase 2, not in current scope**

Phase 2 features to be built after Phase 1 is fully live:

| Feature | Notes |
|---|---|
| **Session Recordings** | Record live sessions and make them available to enrolled students for replay |
| **Newsletter** | Regular email newsletter to students (announcements, tips, industry news) |
| **Online Consultation** | 1-on-1 or group consultation booking with Dr. Sushanth Gade |
| **And more (TBD)** | Client left open-ended — gather more specifics when Phase 1 is complete |

> Do not build any Phase 2 features until explicitly instructed. Phase 1 must be fully live and stable first.

---

*This document reflects the complete state of the AIWMR Training Academy PWA as of April 2026.
It is intended to serve as the principal architect reference for any developer or AI assistant
picking up this project. All architectural decisions, implementation status, database schema,
known bugs, and pending roadmap are documented here.*
