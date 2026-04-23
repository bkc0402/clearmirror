import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '명경지수',
  description: '비대면 국어 과외 학습 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
