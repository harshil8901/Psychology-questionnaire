-- Research questionnaire platform schema

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  progress_percentage numeric(5,2) not null default 0,
  is_completed boolean not null default false,
  session_id text not null unique,
  questionnaire_id text not null,
  questionnaire_version text not null,
  consent_accepted_at timestamptz,
  started_at timestamptz,
  last_section_id text,
  last_question_id text,
  current_step_index int not null default 0,
  demographic_snapshot jsonb
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  question_id text not null,
  section_id text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (response_id, question_id)
);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references public.responses(id) on delete set null,
  event_type text not null,
  section_id text,
  question_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_responses_completed on public.responses(is_completed);
create index if not exists idx_responses_created on public.responses(created_at desc);
create index if not exists idx_answers_response on public.answers(response_id);
create index if not exists idx_analytics_event on public.analytics(event_type, created_at desc);

alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.analytics enable row level security;
alter table public.admin_users enable row level security;

create policy "responses_select" on public.responses for select using (true);
create policy "responses_insert" on public.responses for insert with check (true);
create policy "responses_update" on public.responses for update using (true);

create policy "answers_select" on public.answers for select using (true);
create policy "answers_insert" on public.answers for insert with check (true);
create policy "answers_update" on public.answers for update using (true);

create policy "analytics_insert" on public.analytics for insert with check (true);

create policy "admin_users_self" on public.admin_users for select using (auth.uid() = id);

create policy "responses_admin_all" on public.responses for all
  using (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "answers_admin_all" on public.answers for all
  using (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "analytics_admin_read" on public.analytics for select
  using (exists (select 1 from public.admin_users where id = auth.uid()));
