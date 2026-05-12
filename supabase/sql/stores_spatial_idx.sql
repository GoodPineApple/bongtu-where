-- Supabase → SQL Editor 에 붙여넣어 실행
-- 뷰포트(bbox) 조회 성능 인덱스 + RPC 정의
-- 전제: stores 테이블이 먼저 존재해야 함 (stores_table.sql)

-- 1) 좌표 인덱스 (단순 btree). 한국 범위에 한정된 데이터셋이므로 PostGIS 없이도 충분한 편.
create index if not exists stores_lat_lng_idx
  on public.stores (lat, lng);

-- 2) 뷰포트 + 검색/봉투 필터 RPC.
--    - security invoker 로 호출자 RLS(stores_select_public)를 그대로 적용.
--    - p_query 가 비어있지 않으면 store_name / address ILIKE 검색.
--    - p_bag_type 이 주어지면 bag_types 배열 포함 여부.
--    - p_limit 으로 응답 행 수 상한 (기본 2000).
drop function if exists public.stores_in_bounds(
  double precision, double precision, double precision, double precision,
  text, text, integer
);

create function public.stores_in_bounds(
  sw_lat double precision,
  sw_lng double precision,
  ne_lat double precision,
  ne_lng double precision,
  p_query text default '',
  p_bag_type text default null,
  p_limit integer default 2000
)
returns setof public.stores
language sql
stable
security invoker
set search_path = public
as $$
  select s.*
    from public.stores s
   where s.lat between sw_lat and ne_lat
     and s.lng between sw_lng and ne_lng
     and (
       coalesce(p_query, '') = ''
       or s.store_name ilike '%' || p_query || '%'
       or s.address    ilike '%' || p_query || '%'
     )
     and (
       p_bag_type is null
       or p_bag_type = any(s.bag_types)
     )
   order by s.id
   limit greatest(1, least(coalesce(p_limit, 2000), 5000));
$$;

comment on function public.stores_in_bounds is
  '지도 bounds 안의 stores 를 검색·봉투필터와 함께 반환. RLS 는 호출자 컨텍스트로 적용.';

-- 3) (선택) 봉투 종류 칩용 distinct 목록.
--    뷰포트 결과만 가지고 칩을 만들면 항목이 들쭉날쭉하므로 별도 RPC 로 전체 distinct 만 한 번 가져옴.
drop function if exists public.stores_bag_types();

create function public.stores_bag_types()
returns table (bag_type text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct unnest(s.bag_types) as bag_type
    from public.stores s
   where array_length(s.bag_types, 1) is not null
   order by 1;
$$;

comment on function public.stores_bag_types is
  '전체 stores 에서 등장하는 봉투 종류(distinct) 목록. 필터 칩 구성용.';
