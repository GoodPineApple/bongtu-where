const ADJECTIVES = [
  "배고픈",
  "빠른",
  "조용한",
  "신나는",
  "은근한",
  "든든한",
  "행복한",
  "엄격한",
  "부지런한",
  "느긋한",
]

const BAG_WORDS = [
  "10리터",
  "20리터",
  "75리터",
  "재사용",
  "종량제",
  "봉투",
  "대형마트",
  "편의점",
]

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

export function generateAnonymousNickname(): string {
  return `${pick(ADJECTIVES)} ${pick(BAG_WORDS)}`
}

const STORAGE_KEY = "bongtu_community_anon_nickname"

/**
 * 같은 브라우저에서는 글·댓글 작성자 표시가 바뀌지 않도록 localStorage 에 한 번 저장합니다.
 */
export function getStableAnonymousNickname(): string {
  if (typeof window === "undefined") {
    return generateAnonymousNickname()
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && stored.trim().length > 0) {
      return stored.trim()
    }
    const created = generateAnonymousNickname()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return generateAnonymousNickname()
  }
}
