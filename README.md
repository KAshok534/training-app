# AIWMR Training Academy — PWA

A full Progressive Web App for AIWMR online certification courses.

**Stack:** React 18 · TypeScript · Vite + SWC · vite-plugin-pwa · Supabase · Razorpay

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase + Razorpay credentials

# 3. Run dev server
npm run dev          # opens at http://localhost:3000

# 4. Build for production
npm run build
npm run preview      # test production build locally
```

---

## PWA Features

- ✅ Install prompt (custom banner appears automatically)
- ✅ Add to Home Screen on Android and iOS
- ✅ Works offline (service worker caches all assets)
- ✅ Standalone display mode (no browser chrome when installed)
- ✅ App shortcuts (My Courses, Attendance)
- ✅ Theme colour, splash screen, proper icons
- ✅ Safe area insets (notched phones handled)

### Icons
Replace `public/icons/icon-*.png` with real AIWMR logo PNGs.
Sizes needed: 72, 96, 128, 144, 152, 192, 384, 512.
Use https://maskable.app or https://realfavicongenerator.net to generate them.

---

## Project Structure

```
src/
├── types/index.ts              — All TypeScript interfaces
├── data/index.ts               — Mock data (swap for Supabase queries)
├── lib/
│   ├── supabase.ts             — 🔧 Supabase client (add .env credentials)
│   └── razorpay.ts             — 🔧 Razorpay helper (add .env key)
├── context/
│   └── AuthContext.tsx         — 🔧 Auth state (uncomment Supabase calls)
├── hooks/
│   └── usePWAInstall.ts        — PWA install prompt logic
├── components/
│   ├── Icon.tsx                — SVG icon system
│   ├── UI.tsx                  — Badge, ProgressBar, Btn, Card...
│   ├── BottomNav.tsx           — Bottom navigation
│   ├── InstallBanner.tsx       — PWA install banner
│   └── DemoBanner.tsx          — Demo mode notice
├── screens/
│   ├── SplashScreen.tsx
│   ├── LoginScreen.tsx         — 🔧 Connect real Supabase auth
│   ├── HomeScreen.tsx
│   ├── CoursesScreen.tsx
│   ├── CourseDetailScreen.tsx  — 🔧 Connect real Razorpay payment
│   ├── LearningScreen.tsx      — 🔧 Connect Supabase Storage (videos/PDFs)
│   ├── AttendanceScreen.tsx    — 🔧 Connect QR scanner + Supabase
│   └── CertificateScreen.tsx   — 🔧 Connect PDF generation
├── App.tsx                     — Root component
├── main.tsx                    — Entry point
└── styles/index.css            — Global CSS + CSS variables
```

---

## Connecting Real Data — Step by Step

### Step 1: Supabase Database

Run this SQL in your Supabase SQL editor:

```sql
-- User profiles (extends Supabase auth)
create table profiles (
  id           uuid references auth.users primary key,
  name         text not null,
  phone        text,
  organization text,
  designation  text,
  role         text default 'trainee' check (role in ('trainee','corporate','government','trainer','admin')),
  created_at   timestamptz default now()
);

-- Trigger to create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Courses
create table courses (
  id         serial primary key,
  title      text not null,
  subtitle   text,
  duration   text,
  fee        integer not null,
  seats      integer default 15,
  filled     integer default 0,
  mode       text check (mode in ('Online','Offline','Hybrid')),
  start_date date,
  trainer    text,
  color      text,
  icon       text,
  topics     text[],
  created_at timestamptz default now()
);

-- Batches
create table batches (
  id        serial primary key,
  course_id integer references courses(id),
  label     text,
  date      date,
  time_slot text,
  seats     integer
);

-- Registrations
create table registrations (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id),
  course_id       integer references courses(id),
  batch_id        integer references batches(id),
  payment_status  text default 'pending',
  payment_id      text,
  registration_id text unique,
  created_at      timestamptz default now()
);

-- Attendance
create table attendance (
  id              uuid default gen_random_uuid() primary key,
  registration_id uuid references registrations(id),
  session_date    date not null,
  marked_at       timestamptz default now()
);

-- Modules
create table modules (
  id          serial primary key,
  course_id   integer references courses(id),
  title       text,
  type        text check (type in ('video','pdf','quiz','assignment')),
  duration    text,
  order_index integer,
  video_url   text,  -- Supabase Storage URL
  pdf_url     text,  -- Supabase Storage URL
  description text
);

-- User progress
create table user_progress (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id),
  module_id   integer references modules(id),
  status      text default 'locked' check (status in ('locked','in-progress','completed')),
  updated_at  timestamptz default now(),
  unique(user_id, module_id)
);

-- Certificates
create table certificates (
  id              uuid default gen_random_uuid() primary key,
  registration_id uuid references registrations(id) unique,
  cert_id         text unique,
  issued_at       timestamptz default now(),
  pdf_url         text
);

-- Enable Row Level Security on all tables
alter table profiles      enable row level security;
alter table registrations enable row level security;
alter table attendance    enable row level security;
alter table user_progress enable row level security;
alter table certificates  enable row level security;

-- Basic RLS policies (expand as needed)
create policy "Users read own profile"    on profiles      for select using (auth.uid()=id);
create policy "Users read own registrations" on registrations for select using (auth.uid()=user_id);
create policy "Users read own attendance" on attendance    for select using (
  registration_id in (select id from registrations where user_id=auth.uid())
);
```

### Step 2: Activate Auth in AuthContext.tsx

In `src/context/AuthContext.tsx`, uncomment the three TODO blocks.

### Step 3: Activate Real Payments

In `src/screens/CourseDetailScreen.tsx`, replace the `handlePay` mock with the real Razorpay call shown in the comment.

You'll also need a Supabase Edge Function to create Razorpay orders server-side:

```bash
supabase functions new create-razorpay-order
```

```typescript
// supabase/functions/create-razorpay-order/index.ts
import Razorpay from 'npm:razorpay';
const rzp = new Razorpay({ key_id: Deno.env.get('RAZORPAY_KEY_ID'), key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') });
Deno.serve(async (req) => {
  const { amount } = await req.json();
  const order = await rzp.orders.create({ amount, currency:'INR', receipt:`order_${Date.now()}` });
  return new Response(JSON.stringify(order), { headers:{'Content-Type':'application/json'} });
});
```

### Step 4: QR Attendance

```bash
npm install react-qr-reader
```

Replace the mock scan in `AttendanceScreen.tsx` with:
```tsx
import { QrReader } from 'react-qr-reader';
// On result: validate against supabase 'session_qr_codes' table, then insert to 'attendance'
```

### Step 5: PDF Certificates

```bash
npm install @react-pdf/renderer
```

Or generate server-side in a Supabase Edge Function and store in Supabase Storage.

---

## Deployment

### Vercel (recommended — free)
```bash
npm install -g vercel
vercel
# Add env vars in Vercel dashboard
```

### Manual (Nginx)
```bash
npm run build
# Upload /dist folder to your server
# Configure Nginx to serve index.html for all routes (SPA mode)
```

---

## Contact
AIWMR · Hyderabad, Telangana
📞 +91 9676975725 · 📧 director@aiwmr.org · 🌐 www.aiwmr.org
