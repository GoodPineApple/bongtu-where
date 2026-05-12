import type { Post } from "@/types/community"

export const INITIAL_MOCK_POSTS: Post[] = [
  {
    id: "mock-1",
    category: "INFO",
    title: "오늘 OO동 마트 20L 재고 넉넉하네요!",
    content:
      "점심쯤 방문했는데 20L 종량제 봉투가 진열대에 꽤 남아 있었어요. 급하게 필요하신 분 참고하세요. (OO동 ○○마트)",
    author: "은근한 20리터",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 12,
    mapSearchHint: "○○마트",
    comments: [
      {
        id: "c-mock-1-1",
        postId: "mock-1",
        content: "정보 감사합니다. 저녁에 들러볼게요!",
        author: "행복한 재사용",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ],
  },
  {
    id: "mock-2",
    category: "QUESTION",
    title: "75L 봉투 파는 곳 보통 어디에 있나요?",
    content:
      "대형 폐기물용으로 75L가 필요한데 주변 마트엔 잘 없더라고요. 보통 어디서 구하시나요?",
    author: "조용한 75리터",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    likes: 5,
    comments: [],
  },
  {
    id: "mock-3",
    category: "CHAT",
    title: "마스크 대란 때 생각나서 무섭네요 ㅠㅠ",
    content:
      "그때도 봉투 구하기 힘들었던 기억이… 이번엔 지도로 미리 확인할 수 있어서 다행이에요.",
    author: "느긋한 봉투",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    likes: 21,
    comments: [
      {
        id: "c-mock-3-1",
        postId: "mock-3",
        content: "저도 그때 트라우마 있어요 ㅋㅋ 지금 서비스 잘 쓰고 있어요",
        author: "신나는 편의점",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
    ],
  },
]
