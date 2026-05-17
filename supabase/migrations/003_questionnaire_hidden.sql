-- Admin-hidden built-in questionnaires (file-based configs remain in repo but are excluded from the app).

create table if not exists public.questionnaire_hidden (
  id text primary key,
  hidden_at timestamptz not null default now()
);

alter table public.questionnaire_hidden enable row level security;

create policy "questionnaire_hidden_admin_all"
  on public.questionnaire_hidden for all
  using (exists (select 1 from public.admin_users where id = auth.uid()));
