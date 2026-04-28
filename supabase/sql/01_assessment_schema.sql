-- ─────────────────────────────────────────────────────────────────────────────
-- Assessment system tables (idempotent + additive)
-- Per CLAUDE.md Section 24 — grading: <60% fail, 60-89% pass, 90%+ pass + reward
-- Safe to re-run. If a table already exists with different columns, missing
-- columns are added via ALTER. Existing data is preserved.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. questions ──────────────────────────────────────────────────────────────
create table if not exists questions (
  id            serial primary key,
  module_id     integer references modules(id) on delete cascade,
  order_index   integer,
  question_text text not null,
  options       text[] not null,
  correct_index integer not null,
  topic_tag     text,
  explanation   text,
  created_at    timestamptz default now()
);

-- Add any missing columns (in case an older version exists)
alter table questions add column if not exists module_id     integer references modules(id) on delete cascade;
alter table questions add column if not exists order_index   integer;
alter table questions add column if not exists question_text text;
alter table questions add column if not exists options       text[];
alter table questions add column if not exists correct_index integer;
alter table questions add column if not exists topic_tag     text;
alter table questions add column if not exists explanation   text;
alter table questions add column if not exists created_at    timestamptz default now();

create index if not exists idx_questions_module on questions(module_id, order_index);

-- ── 2. assessment_attempts ───────────────────────────────────────────────────
create table if not exists assessment_attempts (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id) on delete cascade,
  module_id       integer references modules(id) on delete cascade,
  registration_id uuid references registrations(id) on delete cascade,
  score_pct       numeric(5,2),
  total_questions integer,
  correct_count   integer,
  answers         jsonb,
  passed          boolean,
  reward_earned   boolean default false,
  attempted_at    timestamptz default now()
);

-- Add any missing columns (handles pre-existing table from earlier schema)
alter table assessment_attempts add column if not exists user_id         uuid references profiles(id) on delete cascade;
alter table assessment_attempts add column if not exists module_id       integer references modules(id) on delete cascade;
alter table assessment_attempts add column if not exists registration_id uuid references registrations(id) on delete cascade;
alter table assessment_attempts add column if not exists score_pct       numeric(5,2);
alter table assessment_attempts add column if not exists total_questions integer;
alter table assessment_attempts add column if not exists correct_count   integer;
alter table assessment_attempts add column if not exists answers         jsonb;
alter table assessment_attempts add column if not exists passed          boolean;
alter table assessment_attempts add column if not exists reward_earned   boolean default false;
alter table assessment_attempts add column if not exists attempted_at    timestamptz default now();

create index if not exists idx_attempts_user_module
  on assessment_attempts(user_id, module_id, attempted_at desc);

-- ── 3. student_topic_scores ──────────────────────────────────────────────────
create table if not exists student_topic_scores (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  module_id  integer references modules(id) on delete cascade,
  topic_tag  text not null,
  score_pct  numeric(5,2) not null,
  correct    integer not null,
  total      integer not null,
  updated_at timestamptz default now()
);

alter table student_topic_scores add column if not exists user_id    uuid references profiles(id) on delete cascade;
alter table student_topic_scores add column if not exists module_id  integer references modules(id) on delete cascade;
alter table student_topic_scores add column if not exists topic_tag  text;
alter table student_topic_scores add column if not exists score_pct  numeric(5,2);
alter table student_topic_scores add column if not exists correct    integer;
alter table student_topic_scores add column if not exists total      integer;
alter table student_topic_scores add column if not exists updated_at timestamptz default now();

-- Unique constraint (skip if already present)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'student_topic_scores_user_module_topic_key'
  ) then
    alter table student_topic_scores
      add constraint student_topic_scores_user_module_topic_key
      unique (user_id, module_id, topic_tag);
  end if;
end $$;

-- ── 4. RLS ───────────────────────────────────────────────────────────────────
alter table questions             enable row level security;
alter table assessment_attempts   enable row level security;
alter table student_topic_scores  enable row level security;

drop policy if exists "Auth read questions" on questions;
create policy "Auth read questions" on questions
  for select using (auth.uid() is not null);

drop policy if exists "Users read own attempts" on assessment_attempts;
create policy "Users read own attempts" on assessment_attempts
  for select using (auth.uid() = user_id);
drop policy if exists "Users insert own attempts" on assessment_attempts;
create policy "Users insert own attempts" on assessment_attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users read own topic scores" on student_topic_scores;
create policy "Users read own topic scores" on student_topic_scores
  for select using (auth.uid() = user_id);
drop policy if exists "Users upsert own topic scores" on student_topic_scores;
create policy "Users upsert own topic scores" on student_topic_scores
  for all using (auth.uid() = user_id);
drop policy if exists "Admins read all topic scores" on student_topic_scores;
create policy "Admins read all topic scores" on student_topic_scores
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── 5. modules: extend module_type enum + add slideshow columns ──────────────
-- modules.type is a PostgreSQL enum named module_type.
-- ALTER TYPE ADD VALUE cannot run inside a transaction block, so it must be
-- a standalone statement. Safe to re-run: IF NOT EXISTS skips if already added.
ALTER TYPE module_type ADD VALUE IF NOT EXISTS 'slideshow';

alter table modules add column if not exists slide_count    integer;
alter table modules add column if not exists slide_base_url text;
