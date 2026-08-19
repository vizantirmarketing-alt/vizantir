'use client'

import { useId, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/intel', label: 'Overview' },
  { href: '/intel/search', label: 'Search' },
  { href: '/intel/leads', label: 'Leads' },
] as const

type IntelShellProps = {
  email: string
  children: ReactNode
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/intel') {
    return pathname === '/intel'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SignOutForm({ className }: { className?: string }) {
  return (
    <form action="/intel/auth/signout" method="post">
      <button
        type="submit"
        className={cn(
          'text-sm text-meta transition-colors hover:text-foreground',
          className,
        )}
      >
        Sign out
      </button>
    </form>
  )
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'block border-l py-2 pl-3 text-sm tracking-wide transition-colors',
                active
                  ? 'border-cobalt-primary text-foreground'
                  : 'border-transparent text-meta hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function IntelShell({ email, children }: IntelShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuId = useId()

  return (
    <div className="min-h-svh bg-background">
      <div className="lg:grid lg:min-h-svh lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/8 px-8 py-12 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:self-start">
          <p className="shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
            Intel
          </p>
          <p className="mt-3 shrink-0 text-sm text-meta">Vizantir</p>

          <nav
            aria-label="Intel"
            className="mt-14 min-h-0 flex-1 overflow-y-auto"
          >
            <NavLinks pathname={pathname} />
          </nav>

          <div className="mt-8 shrink-0 space-y-3">
            <p className="truncate text-xs text-meta" title={email}>
              {email}
            </p>
            <SignOutForm />
          </div>
        </aside>

        <div className="flex min-h-svh flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-black/8 px-6 py-4 lg:hidden">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
              Intel
            </p>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center text-foreground"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
            </button>
          </header>

          {mobileOpen ? (
            <nav
              id={menuId}
              aria-label="Intel"
              className="flex max-h-[calc(100svh-4.5rem)] flex-col border-b border-black/8 px-6 py-8 lg:hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
              <div className="mt-8 shrink-0 space-y-3 border-t border-black/8 pt-8">
                <p className="truncate text-xs text-meta" title={email}>
                  {email}
                </p>
                <SignOutForm />
              </div>
            </nav>
          ) : null}

          <main className="flex-1 px-6 py-16 md:px-12 md:py-20 lg:px-16 lg:py-24">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
