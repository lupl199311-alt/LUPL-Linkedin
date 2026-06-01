-- ───────────────────────────────────────────────
-- LUPL 링크드인 생성기 — Supabase 스키마 v2
-- Supabase > SQL Editor 에 붙여넣고 RUN
-- ───────────────────────────────────────────────

-- 일별 수업 기록
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null default current_date,
  place text not null,
  scene text not null,
  feeling text,
  session text,           -- 회차 정보 (예: "2회차")
  mode text default 'reflection',
  created_at timestamptz not null default now()
);

-- 생성된 초안
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  log_id uuid references public.daily_logs(id) on delete cascade,
  tone text not null,
  text text not null,
  posted boolean not null default false,
  created_at timestamptz not null default now()
);

-- 해시태그 누적 히스토리
create table if not exists public.tag_history (
  tag text primary key,
  used_count integer not null default 1,
  last_used_at timestamptz not null default now()
);

create index if not exists drafts_log_id_idx on public.drafts(log_id);
create index if not exists daily_logs_created_idx on public.daily_logs(created_at desc);
create index if not exists tag_history_count_idx on public.tag_history(used_count desc);

-- 태그 upsert 함수 (사용할 때마다 카운트 +1)
create or replace function public.upsert_tag(p_tag text)
returns void language plpgsql as $$
begin
  insert into public.tag_history(tag, used_count, last_used_at)
  values (p_tag, 1, now())
  on conflict (tag) do update
    set used_count = tag_history.used_count + 1,
        last_used_at = now();
end;
$$;

-- RLS
alter table public.daily_logs enable row level security;
alter table public.drafts enable row level security;
alter table public.tag_history enable row level security;
-- (service_role 키로만 접근하므로 별도 공개 정책 없음)
