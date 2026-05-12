import Link from "next/link"
import { GlobalNavTabs } from "./global-nav-tabs"

export function GlobalNavBar() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border/80 bg-background/75 supports-backdrop-filter:backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="truncate font-heading text-base font-semibold tracking-tight text-foreground hover:opacity-90"
          >
            봉투어디
          </Link>
        </div>
        <GlobalNavTabs />
      </div>
    </header>
  )
}
