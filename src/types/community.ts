export type PostCategory = "INFO" | "QUESTION" | "CHAT"

export type Comment = {
  id: string
  postId: string
  content: string
  author: string
  createdAt: string
}

export type Post = {
  id: string
  category: PostCategory
  title: string
  content: string
  author: string
  createdAt: string
  likes: number
  comments: Comment[]
  /** 지도 탭으로 넘길 때 검색창에 채울 힌트(선택) */
  mapSearchHint?: string
}
