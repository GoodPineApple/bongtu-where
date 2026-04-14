-- Supabase → SQL Editor 에 붙여넣어 실행
-- 기존 stores 및 정책 삭제 후 재생성 (데이터 전부 삭제됨)

drop table if exists public.stores cascade;

create table public.stores (
  id uuid primary key,
  biz_reg_no text not null default '',
  store_name text not null,
  address text not null default '',
  lat double precision not null,
  lng double precision not null,
  phone text not null default '',
  bag_types text[] not null default array[]::text[],
  stock_status text not null default 'FULL'
    check (stock_status in ('FULL', 'FEW', 'EMPTY')),
  updated_at timestamptz not null default now()
);

comment on table public.stores is '종량제 봉투 판매소 (id=UUID, biz_reg_no=사업자등록번호)';
comment on column public.stores.id is '앱·임포트에서 stable UUID(v5)로 채움';
comment on column public.stores.biz_reg_no is '사업자등록번호 (중복 가능)';

create index stores_biz_reg_no_idx on public.stores (biz_reg_no);
create index stores_bag_types_gin on public.stores using gin (bag_types);

alter table public.stores enable row level security;

create policy "stores_select_public"
  on public.stores
  for select
  to anon, authenticated
  using (true);
