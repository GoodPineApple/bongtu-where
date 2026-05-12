"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Heart, Loader2, MapPin, MessageCircle, PencilLine } from "lucide-react"
import { toast } from "sonner"
import { getStableAnonymousNickname } from "@/lib/community/anonymous-nickname"
import { supabase } from "@/lib/supabase/browser-client"
import { useCommunityBoard } from "@/components/features/community/use-community-board"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { PostCategory } from "@/types/community"

const CATEGORY_LABEL: Record<PostCategory, string> = {
  INFO: "정보공유",
  QUESTION: "질문",
  CHAT: "잡담",
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function previewText(content: string, max = 140): string {
  const t = content.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export type CommunityViewProps = {
  onRequestMapTab: (searchHint?: string) => void
}

export function CommunityView({ onRequestMapTab }: CommunityViewProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [sessionAuthor, setSessionAuthor] = useState("")
  useEffect(() => {
    setSessionAuthor(getStableAnonymousNickname())
  }, [])

  const authorForSubmit = sessionAuthor || getStableAnonymousNickname()
  const {
    posts,
    loading,
    error,
    remote,
    reload,
    submitPost,
    submitComment,
    likePost,
  } = useCommunityBoard(supabase)
  const [detailPostId, setDetailPostId] = useState<string | null>(null)
  const [writeOpen, setWriteOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")
  const [newCategory, setNewCategory] = useState<PostCategory>("INFO")
  const [commentDraft, setCommentDraft] = useState("")
  const commentSubmitLock = useRef(false)

  const detailPost = useMemo(
    () => posts.find((p) => p.id === detailPostId) ?? null,
    [posts, detailPostId],
  )

  async function handleSubmitPost() {
    const title = newTitle.trim()
    const content = newBody.trim()
    if (!title || !content) {
      toast.error("제목과 본문을 모두 입력해 주세요.")
      return
    }
    try {
      await submitPost({
        category: newCategory,
        title,
        content,
        author: authorForSubmit,
      })
      setNewTitle("")
      setNewBody("")
      setNewCategory("INFO")
      setWriteOpen(false)
      toast.success("글이 등록되었습니다.")
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "글 등록에 실패했습니다."
      toast.error(message)
    }
  }

  function handleLike(postId: string) {
    void likePost(postId)
  }

  async function handleSubmitComment() {
    if (!detailPost || commentSubmitLock.current) return
    const text = commentDraft.trim()
    if (!text) {
      toast.error("댓글 내용을 입력해 주세요.")
      return
    }
    commentSubmitLock.current = true
    try {
      await submitComment(
        detailPost.id,
        text,
        authorForSubmit,
      )
      setCommentDraft("")
      toast.success("댓글이 등록되었습니다.")
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "댓글 등록에 실패했습니다."
      toast.error(message)
    } finally {
      commentSubmitLock.current = false
    }
  }

  return (
    <div className="relative min-h-full bg-muted/30 pb-24">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold text-foreground">
            익명 커뮤니티
          </h1>
          <p className="text-sm text-muted-foreground">
            로그인 없이 익명으로 이야기를 나눠 보세요. 이 브라우저에서는 같은
            닉네임으로 글과 댓글이 올라갑니다.
            {remote ? null : (
              <span className="mt-1 block text-amber-700 dark:text-amber-500">
                Supabase 환경 변수가 없어 로컬 예시 데이터만 표시됩니다.
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div
            className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-5 animate-spin" aria-hidden />
            게시글을 불러오는 중…
          </div>
        ) : null}

        {!loading && error && remote ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-medium">불러오기 오류</p>
            <p className="mt-1 text-destructive/90">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void reload()}
            >
              다시 시도
            </Button>
          </div>
        ) : null}

        <ul className="space-y-3" aria-label="게시글 목록">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => setDetailPostId(post.id)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {CATEGORY_LABEL[post.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatCreatedAt(post.createdAt)}
                  </span>
                </div>
                <h2 className="font-medium text-foreground">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {previewText(post.content)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.author}</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-3.5" aria-hidden />
                    {post.comments.length}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3.5" aria-hidden />
                    {post.likes}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        size="icon-lg"
        className="fixed bottom-6 right-4 z-30 size-14 rounded-full shadow-lg"
        onClick={() => setWriteOpen(true)}
        aria-label="글쓰기"
      >
        <PencilLine className="size-6" />
      </Button>

      {isDesktop ? (
        <Dialog open={writeOpen} onOpenChange={setWriteOpen}>
          <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
            <DialogHeader className="border-b border-border text-left">
              <DialogTitle>새 글 작성</DialogTitle>
              <DialogDescription>
                제목·본문·카테고리를 입력하면 목록 맨 위에 올라갑니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABEL) as PostCategory[]).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={newCategory === cat ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setNewCategory(cat)}
                  >
                    {CATEGORY_LABEL[cat]}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-10"
              />
              <textarea
                placeholder="본문을 입력하세요"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={8}
                className={cn(
                  "min-h-[160px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                )}
              />
            </div>
            <DialogFooter className="mt-0 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setWriteOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => void handleSubmitPost()}
              >
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={writeOpen} onOpenChange={setWriteOpen}>
          <SheetContent side="bottom" className="max-h-[90dvh] gap-0">
            <SheetHeader className="border-b border-border text-left">
              <SheetTitle>새 글 작성</SheetTitle>
              <SheetDescription>
                제목·본문·카테고리를 입력하면 목록 맨 위에 올라갑니다.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABEL) as PostCategory[]).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={newCategory === cat ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setNewCategory(cat)}
                  >
                    {CATEGORY_LABEL[cat]}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-10"
              />
              <textarea
                placeholder="본문을 입력하세요"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={8}
                className={cn(
                  "min-h-[160px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                )}
              />
            </div>
            <SheetFooter className="border-t border-border sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setWriteOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => void handleSubmitPost()}
              >
                등록
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {isDesktop ? (
        <Dialog
          open={detailPost != null}
          onOpenChange={(open) => {
            if (!open) setDetailPostId(null)
          }}
        >
          <DialogContent className="max-h-[min(90dvh,880px)] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
            {detailPost ? (
              <>
                <DialogHeader className="border-b border-border p-4 text-left">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {CATEGORY_LABEL[detailPost.category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatCreatedAt(detailPost.createdAt)}
                    </span>
                  </div>
                  <DialogTitle className="text-lg leading-snug">
                    {detailPost.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {CATEGORY_LABEL[detailPost.category]}, 작성자 표시명{" "}
                    {detailPost.author}
                  </DialogDescription>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {detailPost.author}
                    </span>
                  </p>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {detailPost.content}
                    </p>
                    {detailPost.mapSearchHint ? (
                      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
                        <p className="mb-2 text-xs text-muted-foreground">
                          이 글에 판매소 이름이 언급되어 있어요. 지도에서 검색해
                          볼 수 있습니다.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            onRequestMapTab(detailPost.mapSearchHint)
                            setDetailPostId(null)
                          }}
                        >
                          <MapPin className="size-3.5" aria-hidden />
                          지도에서 &ldquo;{detailPost.mapSearchHint}&rdquo; 찾기
                        </Button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleLike(detailPost.id)}
                      >
                        <Heart className="size-3.5" aria-hidden />
                        좋아요 {detailPost.likes}
                      </Button>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">
                        댓글 {detailPost.comments.length}
                      </h3>
                      <ul className="space-y-3">
                        {detailPost.comments.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-lg border border-border bg-card px-3 py-2"
                          >
                            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {c.author}
                              </span>
                              <span className="text-[0.65rem] text-muted-foreground">
                                {formatCreatedAt(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90">
                              {c.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-border bg-background p-4">
                    <label className="sr-only" htmlFor="community-comment">
                      댓글 작성
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="community-comment"
                        placeholder="댓글을 입력하세요"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        className="h-10 flex-1"
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" || e.shiftKey) return
                          if (e.repeat || e.nativeEvent.isComposing) return
                          e.preventDefault()
                          void handleSubmitComment()
                        }}
                      />
                      <Button
                        type="button"
                        className="shrink-0"
                        onClick={() => void handleSubmitComment()}
                      >
                        등록
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet
          open={detailPost != null}
          onOpenChange={(open) => {
            if (!open) setDetailPostId(null)
          }}
        >
          <SheetContent side="bottom" className="max-h-[92dvh] gap-0 p-0">
            {detailPost && (
              <>
                <SheetHeader className="border-b border-border p-4 text-left">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {CATEGORY_LABEL[detailPost.category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatCreatedAt(detailPost.createdAt)}
                    </span>
                  </div>
                  <SheetTitle className="text-lg leading-snug">
                    {detailPost.title}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {detailPost.author}
                    </span>
                  </p>
                </SheetHeader>

                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="space-y-4 overflow-y-auto p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {detailPost.content}
                    </p>
                    {detailPost.mapSearchHint ? (
                      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
                        <p className="mb-2 text-xs text-muted-foreground">
                          이 글에 판매소 이름이 언급되어 있어요. 지도에서 검색해 볼
                          수 있습니다.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            onRequestMapTab(detailPost.mapSearchHint)
                            setDetailPostId(null)
                          }}
                        >
                          <MapPin className="size-3.5" aria-hidden />
                          지도에서 &ldquo;{detailPost.mapSearchHint}&rdquo; 찾기
                        </Button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleLike(detailPost.id)}
                      >
                        <Heart className="size-3.5" aria-hidden />
                        좋아요 {detailPost.likes}
                      </Button>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">
                        댓글 {detailPost.comments.length}
                      </h3>
                      <ul className="space-y-3">
                        {detailPost.comments.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-lg border border-border bg-card px-3 py-2"
                          >
                            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {c.author}
                              </span>
                              <span className="text-[0.65rem] text-muted-foreground">
                                {formatCreatedAt(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90">
                              {c.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-border bg-background p-4">
                    <label className="sr-only" htmlFor="community-comment">
                      댓글 작성
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="community-comment"
                        placeholder="댓글을 입력하세요"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        className="h-10 flex-1"
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" || e.shiftKey) return
                          if (e.repeat || e.nativeEvent.isComposing) return
                          e.preventDefault()
                          void handleSubmitComment()
                        }}
                      />
                      <Button
                        type="button"
                        className="shrink-0"
                        onClick={() => void handleSubmitComment()}
                      >
                        등록
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
