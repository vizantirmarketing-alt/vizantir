'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type HomeLogoLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'>

/** Logo link to "/": scrolls to the top when already on the homepage, navigates normally otherwise. */
export function HomeLogoLink({ onClick, ...props }: HomeLogoLinkProps) {
  const pathname = usePathname()

  return (
    <Link
      href="/"
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || pathname !== '/') return
        event.preventDefault()
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      }}
      {...props}
    />
  )
}
