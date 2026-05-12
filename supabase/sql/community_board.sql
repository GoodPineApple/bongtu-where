-- Supabase → SQL Editor 에 붙여넣어 실행
-- 익명 커뮤니티 게시글·댓글 + 공개 조회 + anon 작성 + 좋아요 RPC

drop function if exists public.increment_community_post_likes(uuid);
drop table if exists public.community_comments cascade;
drop table if exists public.community_posts cascade;

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('INFO', 'QUESTION', 'CHAT')),
  title text not null,
  content text not null,
  author text not null,
  likes integer not null default 0 check (likes >= 0),
  map_search_hint text null,
  created_at timestamptz not null default now(),
  constraint community_posts_title_nonempty check (length(trim(title)) > 0),
  constraint community_posts_content_nonempty check (length(trim(content)) > 0)
);

comment on table public.community_posts is '익명 커뮤니티 게시글 (anon insert/select)';
comment on column public.community_posts.map_search_hint is '지도 탭 검색창에 넣을 힌트 (선택, 클라이언트가 채움)';

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  content text not null,
  author text not null,
  created_at timestamptz not null default now(),
  constraint community_comments_content_nonempty check (length(trim(content)) > 0)
);

comment on table public.community_comments is '커뮤니티 댓글 (anon insert/select)';

create index community_posts_created_at_idx
  on public.community_posts (created_at desc);

create index community_comments_post_id_created_at_idx
  on public.community_comments (post_id, created_at asc);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

create policy "community_posts_select_public"
  on public.community_posts
  for select
  to anon, authenticated
  using (true);

create policy "community_posts_insert_anon"
  on public.community_posts
  for insert
  to anon, authenticated
  with check (
    category in ('INFO', 'QUESTION', 'CHAT')
    and length(trim(title)) > 0
    and length(trim(content)) > 0
  );

-- 클라이언트가 likes 를 임의로 바꾸지 못하게 update 정책은 두지 않음.
create policy "community_comments_select_public"
  on public.community_comments
  for select
  to anon, authenticated
  using (true);

create policy "community_comments_insert_anon"
  on public.community_comments
  for insert
  to anon, authenticated
  with check (
    length(trim(content)) > 0
    and exists (
      select 1 from public.community_posts p where p.id = post_id
    )
  );

create or replace function public.increment_community_post_likes(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_posts
    set likes = likes + 1
    where id = p_id;
end;
$$;

grant execute on function public.increment_community_post_likes(uuid) to anon, authenticated;
