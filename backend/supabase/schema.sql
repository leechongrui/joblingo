create table if not exists decks (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  title text not null,
  company_name text not null,
  role_title text not null,
  card_count int not null,
  job_description_terms jsonb not null default '[]'::jsonb,
  resume_terms jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key,
  deck_id uuid not null references decks(id) on delete cascade,
  card_order int not null,
  question_zh text not null,
  meaning_en text not null,
  keywords jsonb not null,
  technical_terms jsonb not null default '[]'::jsonb,
  answer_plan_en jsonb not null default '[]'::jsonb,
  answer_plan_zh jsonb not null default '[]'::jsonb,
  answer_framework_zh text not null,
  status text not null check (status in ('got_it', 'need_practice', 'unseen'))
);

alter table decks add column if not exists user_id uuid references auth.users(id);
alter table decks add column if not exists job_description_terms jsonb not null default '[]'::jsonb;
alter table decks add column if not exists resume_terms jsonb not null default '[]'::jsonb;
alter table cards add column if not exists technical_terms jsonb not null default '[]'::jsonb;
alter table cards add column if not exists answer_plan_en jsonb not null default '[]'::jsonb;
alter table cards add column if not exists answer_plan_zh jsonb not null default '[]'::jsonb;
create index if not exists decks_user_id_idx on decks(user_id);
