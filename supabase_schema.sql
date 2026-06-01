-- ───────────────────────────────────────────────
-- LUPL 링크드인 생성기 — Supabase 스키마
-- Supabase 프로젝트 > SQL Editor 에 붙여넣고 RUN 하세요.
-- ───────────────────────────────────────────────

-- 일별 수업 기록
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null default current_date,
  place text not null,        -- 장소 · 수업 내용
  scene text not null,        -- 가장 기억에 남은 한 장면
  feeling text,               -- 그때 든 감정 · 생각 (선택)
  created_at timestamptz not null default now()
);

-- 생성된 초안 (톤별)
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  log_id uuid references public.daily_logs(id) on delete cascade,
  tone text not null,         -- 담담한 / 따뜻한 / 단단한
  text text not null,         -- 생성된 본문 (해시태그 제외)
  posted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists drafts_log_id_idx on public.drafts(log_id);
create index if not exists daily_logs_created_idx on public.daily_logs(created_at desc);

-- RLS 켜기. 공개 정책은 만들지 않습니다.
-- 모든 접근은 Vercel 서버리스 함수가 service_role 키로만 하므로,
-- 외부에서 anon 키로 이 테이블에 접근할 수 없습니다(완전 차단).
alter table public.daily_logs enable row level security;
alter table public.drafts enable row level security;
