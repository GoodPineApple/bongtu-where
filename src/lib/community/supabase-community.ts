import type { SupabaseClient } from "@supabase/supabase-js"
import type { Comment, Post, PostCategory } from "@/types/community"

type PostRow = {
  id: string
  category: string
  title: string
  content: string
  author: string
  likes: number
  map_search_hint: string | null
  created_at: string
  community_comments?: CommentRow[] | null
}

type CommentRow = {
  id: string
  post_id: string
  content: string
  author: string
  created_at: string
}

function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    author: row.author,
    createdAt: row.created_at,
  }
}

export function mapPostRow(row: PostRow): Post {
  const raw = row.community_comments ?? []
  const comments = [...raw]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map(mapCommentRow)

  return {
    id: row.id,
    category: row.category as PostCategory,
    title: row.title,
    content: row.content,
    author: row.author,
    createdAt: row.created_at,
    likes: row.likes,
    comments,
    mapSearchHint: row.map_search_hint ?? undefined,
  }
}

export async function fetchCommunityPosts(
  client: SupabaseClient,
): Promise<Post[]> {
  const { data, error } = await client
    .from("community_posts")
    .select(
      `
        id,
        category,
        title,
        content,
        author,
        likes,
        map_search_hint,
        created_at,
        community_comments (
          id,
          post_id,
          content,
          author,
          created_at
        )
      `,
    )
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data as PostRow[]).map(mapPostRow)
}

export async function insertCommunityPost(
  client: SupabaseClient,
  input: {
    category: PostCategory
    title: string
    content: string
    author: string
    mapSearchHint?: string | null
  },
): Promise<Post> {
  const { data, error } = await client
    .from("community_posts")
    .insert({
      category: input.category,
      title: input.title,
      content: input.content,
      author: input.author,
      map_search_hint: input.mapSearchHint ?? null,
    })
    .select(
      "id, category, title, content, author, likes, map_search_hint, created_at",
    )
    .single()

  if (error) throw error
  return mapPostRow({ ...(data as PostRow), community_comments: [] })
}

export async function insertCommunityComment(
  client: SupabaseClient,
  input: { postId: string; content: string; author: string },
): Promise<Comment> {
  const { data, error } = await client
    .from("community_comments")
    .insert({
      post_id: input.postId,
      content: input.content,
      author: input.author,
    })
    .select("id, post_id, content, author, created_at")
    .single()

  if (error) throw error
  return mapCommentRow(data as CommentRow)
}

export async function incrementCommunityPostLikes(
  client: SupabaseClient,
  postId: string,
): Promise<void> {
  const { error } = await client.rpc("increment_community_post_likes", {
    p_id: postId,
  })
  if (error) throw error
}
