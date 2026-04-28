import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "봉투어디",
  description: "전국 종량제 봉투 판매소 지도",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ko" className="theme">
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
