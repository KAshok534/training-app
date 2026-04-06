-- =============================================================================
-- AIWMR TRAINING APP — SUPABASE SQL SCHEMA
-- Ashrita Institute for Waste Management & Research
-- Version: 1.0.0  |  April 2026
-- =============================================================================
--
-- HOW TO CREATE THE ADMIN USER (Sushanth):
--   1. Go to Supabase Dashboard → Authentication → Users → "Add User"
--   2. Email: director@aiwmr.org  |  Password: choose a strong one
--   3. Copy the UUID shown after creation
--   4. Run: UPDATE profiles SET role = 'admin' WHERE id = '<paste-uuid-here>';
--
-- =============================================================================

-- EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- SEQUENCES
create sequence if not exists reg_seq  start 1 increment 1;
create sequence if not exists cert_seq start 1 increment 1;

-- ENUMS
do $$ begin
  create type user_role       as enum ('trainee', 'corporate', 'government', 'trainer', 'admin');
  create type course_mode     as enum ('Online', 'Offline', 'Hybrid');
  create type course_category as enum ('Environment', 'Industrial', 'Policy', 'Safety', 'Health', 'Energy', 'Compliance', 'Sustainability');
  create type module_type     as enum ('video', 'pdf', 'quiz', 'assignment');
  create type module_status   as enum ('locked', 'in-progress', 'completed');
  create type payment_status  as enum ('pending', 'paid', 'failed', 'refunded');
  create type notif_type      as enum ('info', 'success', 'warning');
exception when duplicate_object then null;
end $$;

-- =============================================================================
-- TABLES
-- =============================================================================

create table if not exists profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  name          text        not null default '',
  email         text        not null default '',
  phone         text,
  organization  text,
  designation   text,
  avatar_url    text,
  role          user_role   not null default 'trainee',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists courses (
  id            serial          primary key,
  title         text            not null,
  subtitle      text,
  duration      text,
  fee_inr       integer         not null,
  fee_usd       integer         not null default 0,
  hours         text,
  seats         integer         not null default 20,
  filled        integer         not null default 0 check (filled >= 0 and filled <= seats),
  mode          course_mode     not null default 'Online',
  start_date    text,
  badge         text,
  module_count  integer         not null default 0,
  trainer       text,
  category      course_category not null,
  color         text            not null default '#2d5a3d',
  icon          text            not null default '🌿',
  topics        text[]          not null default '{}',
  is_published  boolean         not null default true,
  created_at    timestamptz     not null default now(),
  updated_at    timestamptz     not null default now()
);

create table if not exists batches (
  id            serial      primary key,
  course_id     integer     not null references courses (id) on delete cascade,
  label         text        not null,
  batch_date    date,
  time_slot     text,
  seats         integer     not null default 20,
  filled        integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists registrations (
  id                 uuid          primary key default gen_random_uuid(),
  user_id            uuid          not null references profiles (id) on delete cascade,
  course_id          integer       not null references courses  (id) on delete restrict,
  batch_id           integer       references batches (id) on delete restrict,
  payment_status     payment_status not null default 'pending',
  payment_id         text,
  razorpay_order_id  text,
  razorpay_signature text,
  registration_id    text          unique,
  access_granted     boolean       not null default false,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),
  unique (user_id, course_id)
);

create table if not exists modules (
  id             serial       primary key,
  course_id      integer      not null references courses (id) on delete cascade,
  title          text         not null,
  type           module_type  not null default 'video',
  duration_mins  integer,
  duration_label text,
  order_index    integer      not null default 0,
  video_url      text,
  pdf_url        text,
  description    text,
  is_preview     boolean      not null default false,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

create table if not exists user_progress (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references profiles (id) on delete cascade,
  module_id    integer      not null references modules  (id) on delete cascade,
  status       module_status not null default 'locked',
  started_at   timestamptz,
  completed_at timestamptz,
  updated_at   timestamptz  not null default now(),
  unique (user_id, module_id)
);

create table if not exists questions (
  id            serial      primary key,
  module_id     integer     not null references modules (id) on delete cascade,
  question_text text        not null,
  options       jsonb       not null,  -- [{"id":"a","text":"..."}]
  correct_id    text        not null,
  explanation   text,
  marks         integer     not null default 1,
  order_index   integer     not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists assessment_attempts (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references profiles (id) on delete cascade,
  module_id      integer     not null references modules  (id) on delete cascade,
  answers        jsonb       not null default '{}',
  score          integer     not null default 0,
  max_score      integer     not null default 0,
  percent        numeric(5,2) generated always as (
                   case when max_score = 0 then 0
                   else round((score::numeric / max_score) * 100, 2) end
                 ) stored,
  passed         boolean     not null default false,
  attempt_number integer     not null default 1,
  submitted_at   timestamptz not null default now()
);

create table if not exists student_topic_scores (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references profiles (id) on delete cascade,
  course_id       integer     not null references courses  (id) on delete cascade,
  topic           text        not null,
  total_questions integer     not null default 0,
  correct_answers integer     not null default 0,
  accuracy_pct    numeric(5,2) generated always as (
                    case when total_questions = 0 then 0
                    else round((correct_answers::numeric / total_questions) * 100, 2) end
                  ) stored,
  updated_at      timestamptz not null default now(),
  unique (user_id, course_id, topic)
);

create table if not exists session_qr_codes (
  id           uuid        primary key default gen_random_uuid(),
  course_id    integer     not null references courses (id) on delete cascade,
  batch_id     integer     references batches (id) on delete cascade,
  session_date date        not null,
  qr_code      text        not null unique,
  expires_at   timestamptz,
  created_by   uuid        references profiles (id),
  created_at   timestamptz not null default now()
);

create table if not exists attendance (
  id              uuid        primary key default gen_random_uuid(),
  registration_id uuid        not null references registrations (id) on delete cascade,
  session_date    date        not null,
  marked_at       timestamptz not null default now(),
  qr_code_id      uuid        references session_qr_codes (id),
  unique (registration_id, session_date)
);

create table if not exists certificates (
  id              uuid        primary key default gen_random_uuid(),
  registration_id uuid        not null references registrations (id) on delete cascade unique,
  cert_id         text        not null unique,
  issued_at       timestamptz not null default now(),
  pdf_url         text,
  verify_url      text generated always as (
                    'https://aiwmr.org/verify/' || cert_id
                  ) stored
);

create table if not exists notifications (
  id         uuid       primary key default gen_random_uuid(),
  user_id    uuid       not null references profiles (id) on delete cascade,
  title      text       not null,
  message    text       not null,
  type       notif_type not null default 'info',
  read       boolean    not null default false,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- 1. Auto-create profile on signup
create or replace function fn_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_new_user on auth.users;
create trigger trg_new_user
  after insert on auth.users
  for each row execute function fn_handle_new_user();

-- 2. Auto registration ID
create or replace function fn_set_registration_id()
returns trigger language plpgsql as $$
begin
  if new.registration_id is null then
    new.registration_id := 'AIWMR-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('reg_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_registration_id on registrations;
create trigger trg_set_registration_id
  before insert on registrations
  for each row execute function fn_set_registration_id();

-- 3. On payment paid → grant access, increment filled, unlock first module, notify
create or replace function fn_payment_paid()
returns trigger language plpgsql security definer as $$
begin
  if new.payment_status = 'paid' and (old.payment_status is distinct from 'paid') then
    new.access_granted := true;

    if new.batch_id is not null then
      update batches set filled = filled + 1 where id = new.batch_id;
    end if;

    update courses set filled = filled + 1 where id = new.course_id;

    insert into user_progress (user_id, module_id, status)
    select new.user_id, m.id, 'in-progress'
    from modules m
    where m.course_id = new.course_id
    and m.order_index = (select min(order_index) from modules where course_id = new.course_id)
    on conflict (user_id, module_id) do nothing;

    insert into notifications (user_id, title, message, type)
    select new.user_id, 'Enrollment Confirmed!',
           'You are now enrolled in ' || c.title || '. Reg ID: ' || new.registration_id || '.',
           'success'
    from courses c where c.id = new.course_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payment_paid on registrations;
create trigger trg_payment_paid
  before update on registrations
  for each row execute function fn_payment_paid();

-- 4. Auto certificate ID
create or replace function fn_set_cert_id()
returns trigger language plpgsql as $$
begin
  if new.cert_id is null then
    new.cert_id := 'AIWMR-CERT-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('cert_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_cert_id on certificates;
create trigger trg_set_cert_id
  before insert on certificates
  for each row execute function fn_set_cert_id();

-- 5. Auto-issue certificate when all modules completed
create or replace function fn_check_certificate_eligibility()
returns trigger language plpgsql security definer as $$
declare
  v_course_id  integer;
  v_reg_id     uuid;
  v_total_mods integer;
  v_done_mods  integer;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    select course_id into v_course_id from modules where id = new.module_id;

    select id into v_reg_id from registrations
    where user_id = new.user_id and course_id = v_course_id and access_granted = true
    limit 1;

    if v_reg_id is null then return new; end if;

    select count(*) into v_total_mods from modules where course_id = v_course_id;
    select count(*) into v_done_mods
    from user_progress up join modules m on m.id = up.module_id
    where up.user_id = new.user_id and m.course_id = v_course_id and up.status = 'completed';

    if v_done_mods >= v_total_mods then
      insert into certificates (registration_id) values (v_reg_id)
      on conflict (registration_id) do nothing;

      insert into notifications (user_id, title, message, type)
      select new.user_id, 'Certificate Ready! 🎓',
             'Congratulations! Your certificate for ' || c.title || ' is ready to download.',
             'success'
      from courses c where c.id = v_course_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_certificate on user_progress;
create trigger trg_check_certificate
  after update on user_progress
  for each row execute function fn_check_certificate_eligibility();

-- 6. updated_at auto-update
create or replace function fn_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

do $$ declare tbl text;
begin
  foreach tbl in array array['profiles','courses','modules','registrations','user_progress'] loop
    execute format('drop trigger if exists trg_updated_at on %I', tbl);
    execute format('create trigger trg_updated_at before update on %I for each row execute function fn_set_updated_at()', tbl);
  end loop;
end $$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table profiles             enable row level security;
alter table courses              enable row level security;
alter table batches              enable row level security;
alter table registrations        enable row level security;
alter table modules              enable row level security;
alter table user_progress        enable row level security;
alter table questions            enable row level security;
alter table assessment_attempts  enable row level security;
alter table student_topic_scores enable row level security;
alter table session_qr_codes     enable row level security;
alter table attendance           enable row level security;
alter table certificates         enable row level security;
alter table notifications        enable row level security;

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles
create policy "profiles: own read"   on profiles for select using (auth.uid() = id or is_admin());
create policy "profiles: own update" on profiles for update using (auth.uid() = id or is_admin());
create policy "profiles: insert"     on profiles for insert with check (auth.uid() = id or is_admin());

-- courses (public read for catalog browsing)
create policy "courses: public read"  on courses for select using (is_published = true);
create policy "courses: admin write"  on courses for all   using (is_admin());

-- batches
create policy "batches: auth read"  on batches for select using (auth.uid() is not null);
create policy "batches: admin write" on batches for all   using (is_admin());

-- modules (paid students or preview)
create policy "modules: read" on modules for select using (
  auth.uid() is not null and (
    is_preview = true or is_admin()
    or exists (
      select 1 from registrations r
      where r.user_id = auth.uid() and r.course_id = modules.course_id and r.access_granted = true
    )
  )
);
create policy "modules: admin write" on modules for all using (is_admin());

-- questions
create policy "questions: paid students" on questions for select using (
  is_admin() or exists (
    select 1 from registrations r join modules m on m.course_id = r.course_id
    where r.user_id = auth.uid() and r.access_granted = true and m.id = questions.module_id
  )
);
create policy "questions: admin write" on questions for all using (is_admin());

-- registrations
create policy "registrations: own read"   on registrations for select using (user_id = auth.uid() or is_admin());
create policy "registrations: own insert" on registrations for insert with check (user_id = auth.uid());
create policy "registrations: own update" on registrations for update using (user_id = auth.uid() or is_admin());
create policy "registrations: admin delete" on registrations for delete using (is_admin());

-- user_progress
create policy "user_progress: own" on user_progress for all using (user_id = auth.uid() or is_admin());

-- assessment_attempts
create policy "assessment_attempts: own read"   on assessment_attempts for select using (user_id = auth.uid() or is_admin());
create policy "assessment_attempts: own insert" on assessment_attempts for insert with check (user_id = auth.uid());

-- student_topic_scores
create policy "topic_scores: own read" on student_topic_scores for select using (user_id = auth.uid() or is_admin());
create policy "topic_scores: admin"    on student_topic_scores for all   using (is_admin());

-- session_qr_codes
create policy "qr_codes: auth read"  on session_qr_codes for select using (auth.uid() is not null);
create policy "qr_codes: admin write" on session_qr_codes for all  using (is_admin());

-- attendance
create policy "attendance: own read" on attendance for select using (
  is_admin() or exists (
    select 1 from registrations r where r.id = attendance.registration_id and r.user_id = auth.uid()
  )
);
create policy "attendance: own insert" on attendance for insert with check (
  exists (
    select 1 from registrations r
    where r.id = attendance.registration_id and r.user_id = auth.uid() and r.access_granted = true
  )
);
create policy "attendance: admin write" on attendance for all using (is_admin());

-- certificates
create policy "certificates: own read" on certificates for select using (
  is_admin() or exists (
    select 1 from registrations r where r.id = certificates.registration_id and r.user_id = auth.uid()
  )
);
create policy "certificates: system insert" on certificates for insert with check (is_admin());

-- notifications
create policy "notifications: own read/update" on notifications for select using (user_id = auth.uid() or is_admin());
create policy "notifications: own mark read"   on notifications for update using (user_id = auth.uid() or is_admin());
create policy "notifications: admin insert"    on notifications for insert with check (is_admin());

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_registrations_user     on registrations        (user_id);
create index if not exists idx_registrations_course   on registrations        (course_id);
create index if not exists idx_user_progress_user     on user_progress        (user_id);
create index if not exists idx_user_progress_module   on user_progress        (module_id);
create index if not exists idx_assessment_user_module on assessment_attempts  (user_id, module_id);
create index if not exists idx_attendance_reg         on attendance           (registration_id);
create index if not exists idx_notifications_user     on notifications        (user_id, read);
create index if not exists idx_modules_course         on modules              (course_id, order_index);
create index if not exists idx_questions_module       on questions            (module_id, order_index);
create index if not exists idx_topic_scores_user      on student_topic_scores (user_id, course_id);

-- =============================================================================
-- SEED: 15 COURSES
-- =============================================================================

insert into courses (id, title, subtitle, duration, fee_inr, fee_usd, hours, seats, filled, mode, start_date, badge, module_count, trainer, category, color, icon, topics) values
(1,  'Certificate in Environment & Waste Management',    'CEWM · Long Term Program', '5 Months',   16000, 175, '150 Hrs', 20, 0, 'Online', 'Jul 15, 2026',      'Flagship', 5, 'Dr. Sushanth Gade', 'Environment',   '#2d5a3d', '🌿', array['Environment Management','Introduction to Waste Management','Solid Waste Streams & Management Hierarchy','Source Segregation & MRF','Waste Collection & Transportation Logistics','Smart & Digital Waste Management','Waste Transfer & Processing Systems','Waste Treatment & Disposal','Recycling, Circular Economy & EPR','IPR & Technology Management in Waste Systems','Organic / Food Waste Management','Industrial / Hazardous Waste Management','Plastics Waste Management','Dumpsite & Landfill Management','Energy Recovery & Waste-to-Energy (WtE)','Waste Processing Technologies','Waste Economics, Finance & Institutional Management','Stakeholder Engagement & Community Participation','Behavioral Change in Waste Management','EH&S in Waste Systems','Waste Conventions, Protocols & International Regulations','Career & Business Prospects in Waste Management','Resource Efficiency and Resource Recovery','Impact of Waste on Biodiversity and the Environment','ESG - Environment, Sustainability & Governance','Climate Change, Carbon Management & Waste Sector Emissions']),
(2,  'Integrated Solid Waste Management',               'ISWM · Short Term',        'Short Term',  6500,  75,  '60 Hrs',  20, 0, 'Online', 'To be announced',   'New',      2, 'Dr. Sushanth Gade', 'Environment',   '#4a7c59', '🗑️', array['Solid Waste Streams & Classification','Collection & Transportation Systems','Material Recovery Facilities (MRF)','Waste Treatment Technologies','Integrated Waste Planning & Policy','Case Studies & Best Practices']),
(3,  'Bio Medical Waste Management',                    'BMWM · Short Term',        'Short Term',  6500,  75,  '60 Hrs',  20, 0, 'Online', 'To be announced',   'New',      2, 'Dr. Sushanth Gade', 'Health',        '#c0392b', '🏥', array['Classification of Bio Medical Waste','Segregation, Packaging & Labelling','Storage, Collection & Transportation','Treatment & Disposal Methods','Legal & Regulatory Framework','Healthcare Facility Compliance']),
(4,  'Industrial Waste Management',                     'IWM · Short Term',         'Short Term',  6500,  75,  '60 Hrs',  20, 0, 'Online', 'To be announced',   'New',      2, 'Dr. Sushanth Gade', 'Industrial',    '#8b6f47', '🏭', array['Types of Industrial Waste','Waste Characterization & Assessment','Treatment & Disposal Technologies','Pollution Prevention Strategies','Regulatory Compliance & Reporting','Industrial EHS Management']),
(5,  'Circular Economy & EPR',                          'CE & EPR · Short Term',    'Short Term',  8000,  85,  '75 Hrs',  20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Policy',        '#1a6b8a', '♻️', array['Circular Economy Principles','Extended Producer Responsibility (EPR)','Product Life Cycle Analysis','Resource Recovery Strategies','EPR Policy & Regulations in India','Sustainable Business Models']),
(6,  'Landfill Management',                             'LFM · Short Term',         'Short Term',  8000,  85,  '75 Hrs',  20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Industrial',    '#5d4037', '🏔️', array['Landfill Site Selection & Design','Leachate & Gas Management','Environmental Monitoring','Landfill Operations & Safety','Closure & Aftercare','Regulations & Compliance']),
(7,  'E-Waste Management',                              'EWM · Short Term',         'Short Term',  8000,  85,  '75 Hrs',  20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Industrial',    '#1565c0', '💻', array['E-Waste Categories & Hazardous Components','Collection & Dismantling Processes','Refurbishment & Reuse','Recycling Technologies & Smelting','E-Waste Rules & Producer Responsibility','Global E-Waste Trends']),
(8,  'Organic Waste Management',                        'OWM · Short Term',         'Short Term',  8000,  85,  '75 Hrs',  20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Environment',   '#558b2f', '🌱', array['Food & Organic Waste Streams','Composting Technologies','Anaerobic Digestion & Biogas','Vermicomposting','Source Segregation for Organics','Organic Waste Policy & Markets']),
(9,  'Transfer Station Management',                     'TSM · Short Term',         'Short Term',  8000,  85,  '75 Hrs',  20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Industrial',    '#6a1e72', '🚚', array['Transfer Station Design & Layout','Receiving & Compaction Operations','Fleet & Logistics Management','Health, Safety & Environment','Regulatory Requirements','Operational Cost Optimization']),
(10, 'Waste to Energy',                                 'W2E · Short Term',         'Short Term', 10000, 100,  '100 Hrs', 20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Energy',        '#e65100', '⚡', array['Waste-to-Energy Technologies Overview','Incineration & Combustion Systems','Refuse Derived Fuel (RDF)','Biogas & Landfill Gas Recovery','Pyrolysis & Gasification','Project Economics & Policy']),
(11, 'Hazardous Waste Management',                      'HWM · Short Term',         'Short Term', 10000, 100,  '100 Hrs', 20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Industrial',    '#b71c1c', '⚠️', array['Hazardous Waste Classification & Identification','Chemical Hazard Assessment','Storage, Handling & Transport','Treatment & Disposal Technologies','Emergency Response & Incident Management','Regulatory Compliance & Reporting']),
(12, 'Waste Characterization & Audits',                 'WCA · Short Term',         'Short Term',  5000,  50,  '40 Hrs',  20, 0, 'Online', 'To be announced',   'New',      1, 'Dr. Sushanth Gade', 'Environment',   '#37474f', '📊', array['Waste Composition Studies','Sampling Methodologies','Laboratory Analysis Techniques','Data Interpretation & Reporting','Waste Audit Planning','Benchmarking & Performance Indicators']),
(13, 'ESG — Environmental, Social & Governance',        'ESG · Short Term',         'Short Term',  8000,  85,  '75 Hrs',  20, 0, 'Online', 'To be announced',   'New',      3, 'Dr. Sushanth Gade', 'Compliance',    '#1b5e20', '🌍', array['ESG Frameworks & Global Standards','Environmental Reporting & Metrics','Social Impact & Stakeholder Engagement','Governance Structures & Accountability','ESG Ratings & Investor Relations','Sustainability Reporting (GRI, BRSR)']),
(14, 'Sustainable Consumption & Production',            'SCP · Short Term',         'Short Term',  5000,  50,  '40 Hrs',  20, 0, 'Online', 'To be announced',   'New',      2, 'Dr. Sushanth Gade', 'Sustainability', '#4527a0', '🔄', array['UN SDG 12 — SCP Framework','Life Cycle Thinking','Green Procurement & Supply Chain','Consumer Behaviour & Demand Management','Eco-Labelling & Certifications','SCP Policy Tools & Case Studies']),
(15, 'Environmental Management & Legal Compliance',     'EMLC · Short Term',        'Short Term',  5000,  50,  '40 Hrs',  20, 0, 'Online', 'To be announced',   'New',      2, 'Dr. Sushanth Gade', 'Compliance',    '#1a237e', '⚖️', array['Environmental Laws in India','Environmental Impact Assessment (EIA)','Consents, Permits & Authorizations','Environmental Management Systems (ISO 14001)','Corporate Environmental Liability','Compliance Auditing & Reporting'])

on conflict (id) do update set
  title = excluded.title, subtitle = excluded.subtitle,
  fee_inr = excluded.fee_inr, fee_usd = excluded.fee_usd,
  topics = excluded.topics, updated_at = now();

select setval(pg_get_serial_sequence('courses', 'id'), 15, true);

-- =============================================================================
-- SEED: BATCHES (CEWM)
-- =============================================================================

insert into batches (course_id, label, batch_date, time_slot, seats, is_active) values
  (1, 'Evening Batch', '2026-07-15', '7:00 PM – 9:00 PM',   20, true),
  (1, 'Morning Batch', '2026-07-20', '10:00 AM – 12:00 PM', 20, true)
on conflict do nothing;

-- =============================================================================
-- SEED: SAMPLE MODULES (CEWM)
-- =============================================================================

insert into modules (course_id, title, type, duration_label, duration_mins, order_index, description, is_preview) values
  (1, 'Environment Management',           'video', '45 min', 45, 1, 'Introduction to environmental management systems and frameworks.', true),
  (1, 'Introduction to Waste Management', 'pdf',   '30 min', 30, 2, 'Foundational concepts in waste management.',                     false),
  (1, 'Solid Waste Streams & Hierarchy',  'video', '60 min', 60, 3, 'Understanding waste hierarchies and classifications.',           false),
  (1, 'Source Segregation & MRF',         'pdf',   '40 min', 40, 4, 'Principles of source segregation and material recovery.',        false),
  (1, 'Waste Collection Logistics',       'video', '55 min', 55, 5, 'Route optimisation, fleet management and collection systems.',   false)
on conflict do nothing;

-- =============================================================================
-- ADMIN DASHBOARD VIEWS
-- =============================================================================

create or replace view admin_student_overview as
select
  p.id as user_id, p.name, p.email, p.phone, p.organization, p.role,
  r.registration_id as reg_code,
  c.title as course_title,
  b.label as batch_label, b.batch_date,
  r.payment_status, r.access_granted,
  r.created_at as registered_at,
  (select count(*) from user_progress up join modules m on m.id = up.module_id
   where up.user_id = p.id and m.course_id = r.course_id and up.status = 'completed') as modules_completed,
  (select count(*) from modules m where m.course_id = r.course_id) as modules_total,
  (select count(*) from attendance a where a.registration_id = r.id) as sessions_attended
from profiles p
left join registrations r on r.user_id = p.id
left join courses c on c.id = r.course_id
left join batches b on b.id = r.batch_id
where p.role != 'admin';

create or replace view admin_topic_analysis as
select
  p.name as student_name, p.email,
  c.title as course_title,
  ts.topic, ts.total_questions, ts.correct_answers, ts.accuracy_pct,
  case when ts.accuracy_pct >= 75 then 'Strong'
       when ts.accuracy_pct >= 50 then 'Average'
       else 'Weak' end as performance_band
from student_topic_scores ts
join profiles p on p.id = ts.user_id
join courses  c on c.id = ts.course_id
order by p.name, c.title, ts.accuracy_pct;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
