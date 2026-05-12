"use client"

import { useCallback, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { INITIAL_MOCK_POSTS } from "@/lib/community/mock-posts"
import {
  fetchCommunityPosts,
  incrementCommunityPostLikes,
  insertCommunityComment,
  insertCommunityPost,
} from "@/lib/community/supabase-community"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Comment, Post, PostCategory } from "@/types/community"

export function useCommunityBoard(client: SupabaseClient | null) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(Boolean(client))
  const [error, setError] = useState<string | null>(null)
  const remote = Boolean(client)

  const reload = useCallback(async () => {
    if (!client) {
      setPosts([...INITIAL_MOCK_POSTS])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await fetchCommunityPosts(client)
      setPosts(list)
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "게시글을 불러오지 못했습니다."
      setError(message)
      toast.error(message)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    void reload()
  }, [reload])

  const submitPost = useCallback(
    async (input: {
      category: PostCategory
      title: string
      content: string
      author: string
    }) => {
      if (!client) {
        const now = new Date().toISOString()
        const post: Post = {
          id: `local-${uuidv4()}`,
          category: input.category,
          title: input.title,
          content: input.content,
          author: input.author,
          createdAt: now,
          likes: 0,
          comments: [],
        }
        setPosts((prev) => [post, ...prev])
        return post
      }
      const post = await insertCommunityPost(client, {
        category: input.category,
        title: input.title,
        content: input.content,
        author: input.author,
      })
      setPosts((prev) => [post, ...prev])
      return post
    },
    [client],
  )

  const submitComment = useCallback(
    async (postId: string, content: string, author: string): Promise<Comment> => {
      if (!client) {
        const comment: Comment = {
          id: `local-c-${uuidv4()}`,
          postId,
          content,
          author,
          createdAt: new Date().toISOString(),
        }
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
          ),
        )
        return comment
      }
      const comment = await insertCommunityComment(client, {
        postId,
        content,
        author,
      })
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
        ),
      )
      return comment
    },
    [client],
  )

  const likePost = useCallback(
    async (postId: string) => {
      if (!client) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p,
          ),
        )
        return
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: p.likes + 1 } : p,
        ),
      )
      try {
        await incrementCommunityPostLikes(client, postId)
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p,
          ),
        )
        toast.error("좋아요 처리에 실패했습니다.")
      }
    },
    [client],
  )

  return {
    posts,
    loading,
    error,
    remote,
    reload,
    submitPost,
    submitComment,
    likePost,
  }
}
