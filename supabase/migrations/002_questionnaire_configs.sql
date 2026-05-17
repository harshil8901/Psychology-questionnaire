-- Admin-managed questionnaire configs (JSON). File-based defaults remain in /data/questionnaires.

create table if not exists public.questionnaire_configs (
  id text primary key,
  title text not null,
  version text not null default '1.0',
  estimated_time int not null default 15,
  config jsonb not null,
  is_active boolean not null default false,
  source text not null default 'upload',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_questionnaire_configs_active
  on public.questionnaire_configs(is_active) where is_active = true;

alter table public.questionnaire_configs enable row level security;

create policy "questionnaire_configs_admin_all"
  on public.questionnaire_configs for all
  using (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "questionnaire_configs_read_active"
  on public.questionnaire_configs for select
  using (is_active = true);
