"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, MessagesSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/map", label: "지도", icon: Map },
  { href: "/community", label: "커뮤니티", icon: MessagesSquare },
] as const

export function GlobalNavTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-center gap-1 sm:gap-2"
      aria-label="주요 메뉴"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{label}</span>
            {active && (
              <span
                className="absolute right-2 bottom-1 left-2 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
                aria-hidden
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
