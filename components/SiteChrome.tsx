'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import SmoothScroll from '@/components/SmoothScroll'
import ScrollProgress from '@/components/ScrollProgress'
import { ScrollToTop } from '@/components/ScrollToTop'
import { VizantirChat } from '@/components/chat/VizantirChat'

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isBareDocument =
    pathname.startsWith('/intel') ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/play')

  if (isBareDocument) {
    return <>{children}</>
  }

  return (
    <>
      <SmoothScroll>
        <ScrollToTop />
        <ScrollProgress />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </SmoothScroll>
      <VizantirChat />
    </>
  )
}
