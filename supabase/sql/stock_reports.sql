-- Supabase → SQL Editor 에 붙여넣어 실행
-- 재고 제보 테이블 + RLS + stores 동기화 트리거
-- 전제: stores 테이블이 먼저 생성되어 있어야 함 (stores_table.sql)

drop trigger if exists stock_reports_apply on public.stock_reports;
drop function if exists public.apply_stock_report();
drop table if exists public.stock_reports;

create table public.stock_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  previous_status text null
    check (previous_status is null or previous_status in ('FULL', 'FEW', 'EMPTY')),
  reported_status text not null
    check (reported_status in ('FULL', 'FEW', 'EMPTY')),
  reporter_hash text null,
  created_at timestamptz not null default now()
);

comment on table public.stock_reports is '판매소 재고 제보 로그 (anon insert 가능, 트리거가 stores 동기화)';
comment on column public.stock_reports.previous_status is '제보 직전에 클라이언트가 보던 상태 (감사용, optional)';
comment on column public.stock_reports.reporter_hash is '익명 식별자 (예: 디바이스/IP 기반 해시), rate limit·악용 분석용 optional';

create index stock_reports_store_id_created_at_idx
  on public.stock_reports (store_id, created_at desc);

alter table public.stock_reports enable row level security;

-- anon 은 insert 만 허용. select/update/delete 정책 없음 → 기본 거부.
-- 분석·관리 조회는 service_role 또는 별도 정책 추가 후 수행.
create policy "stock_reports_insert_anon"
  on public.stock_reports
  for insert
  to anon, authenticated
  with check (
    reported_status in ('FULL', 'FEW', 'EMPTY')
  );

-- 새 제보가 들어오면 stores.stock_status 를 즉시 갱신.
-- security definer 로 실행되어 stores 의 update 정책 없이도 갱신 가능.
-- 악용 완화(rate limit, 검증)는 추후 Edge Function 또는 트리거 내 추가 로직으로 보강.
create or replace function public.apply_stock_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stores
    set stock_status = new.reported_status,
        updated_at = now()
    where id = new.store_id;
  return new;
end;
$$;

create trigger stock_reports_apply
  after insert on public.stock_reports
  for each row execute function public.apply_stock_report();
