'use client'

import { useId, useLayoutEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, PanelLeft, X } from 'lucide-react'

import { sidebarCookie, type SidebarState } from '@/lib/intel/sidebar'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/intel', label: 'Overview' },
  { href: '/intel/briefing', label: 'Briefing' },
  { href: '/intel/ai', label: 'Assistant' },
  { href: '/intel/clients', label: 'Clients' },
  { href: '/intel/search', label: 'Search' },
  { href: '/intel/leads', label: 'Leads' },
  { href: '/intel/prospects', label: 'Prospect Research' },
  { href: '/intel/new-businesses', label: 'New Businesses' },
  { href: '/intel/outreach', label: 'Outreach' },
  { href: '/intel/reports', label: 'Reports' },
] as const

type IntelShellFrameProps = {
  email: string
  /** Read from the cookie on the server, so the first paint is already right. */
  initialSidebar: SidebarState
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
          'intel-secondary text-meta transition-colors hover:text-foreground',
          className,
        )}
      >
        Sign out
      </button>
    </form>
  )
}

/**
 * The email with a preferred line break before the "@". overflow-wrap:
 * anywhere on the parent only breaks inside a part when that part alone is
 * still wider than the sidebar.
 */
function EmailText({ email }: { email: string }) {
  const at = email.lastIndexOf('@')
  if (at <= 0) return <>{email}</>
  return (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
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
                // intel-nav: 18px and at least 44px tall in the menu below lg; 14px in the
                // lg+ sidebar, where "Prospect Research" must fit the 128px link width.
                'flex min-h-11 items-center rounded-md px-3 py-2 intel-nav tracking-wide transition-colors lg:block lg:min-h-0',
                active
                  ? 'bg-cobalt-soft text-foreground'
                  : 'text-meta hover:text-foreground',
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

export function IntelShellFrame({ email, initialSidebar, children }: IntelShellFrameProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(initialSidebar === 'collapsed')
  const menuId = useId()
  const sidebarId = useId()

  // While the phone menu is open the page behind it does not scroll. Below lg
  // only: if the window widens past lg with the menu open, the lock lifts.
  // Scroll anchoring is off meanwhile: opening takes the header out of the page
  // flow, and the browser would otherwise follow the content up 73px and lose
  // the reader's place (and on closing, push it 73px down). A layout effect, so
  // both apply before that layout.
  useLayoutEffect(() => {
    if (!mobileOpen) return
    const root = document.documentElement
    const previous = { overflow: root.style.overflow, anchor: root.style.overflowAnchor }
    root.style.overflowAnchor = 'none'
    const desktop = window.matchMedia('(min-width: 64rem)')
    const apply = () => {
      root.style.overflow = desktop.matches ? previous.overflow : 'hidden'
    }
    apply()
    desktop.addEventListener('change', apply)
    return () => {
      desktop.removeEventListener('change', apply)
      root.style.overflow = previous.overflow
      // Lay out the closed menu (header back in the flow) first, so anchoring,
      // once back on, has no shift to follow.
      void root.offsetHeight
      root.style.overflowAnchor = previous.anchor
    }
  }, [mobileOpen])

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = sidebarCookie(next ? 'collapsed' : 'expanded', window.location.protocol === 'https:')
  }

  return (
    // tabular-nums: every count, value, date and time in Intel lines up.
    // intel-scope: Intel's darker text tokens and solid disabled states (app/globals.css).
    <div className="intel-scope min-h-svh bg-background tabular-nums">
      {/*
        Desktop sidebar toggle. Fixed at the same spot whether the sidebar is
        open or closed, so toggling twice needs no pointer movement. Below lg
        the sidebar is replaced by the header menu, so the toggle is hidden.
      */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-expanded={!collapsed}
        aria-controls={sidebarId}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="fixed left-3 top-3 z-40 hidden size-8 items-center justify-center rounded-md text-meta transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus lg:inline-flex"
      >
        <PanelLeft className="size-4" aria-hidden />
      </button>

      <div
        className={cn(
          'lg:grid lg:min-h-svh lg:transition-[grid-template-columns] lg:duration-200 lg:ease-out motion-reduce:transition-none',
          collapsed ? 'lg:grid-cols-[0rem_minmax(0,1fr)]' : 'lg:grid-cols-[13.5rem_minmax(0,1fr)]',
        )}
      >
        {/*
          The aside clips to its grid column; the fixed-width inner panel slides
          out of view as the column closes. inert removes the collapsed
          navigation from the tab order and the accessibility tree.
        */}
        <aside
          id={sidebarId}
          inert={collapsed}
          aria-hidden={collapsed || undefined}
          className={cn(
            'hidden overflow-hidden border-r lg:sticky lg:top-0 lg:block lg:h-svh lg:self-start',
            collapsed ? 'border-transparent' : 'border-black/8',
          )}
        >
          <div className="flex h-full w-[13.5rem] flex-col px-8 py-12">
            <p className="shrink-0 intel-eyebrow text-cobalt-text">
              Intel
            </p>
            <p className="mt-3 shrink-0 intel-secondary text-meta">Vizantir</p>

            <nav
              aria-label="Intel"
              className="mt-14 min-h-0 flex-1 overflow-y-auto"
            >
              <NavLinks pathname={pathname} />
            </nav>

            <div className="mt-8 shrink-0 space-y-3">
              <p className="intel-secondary text-meta [overflow-wrap:anywhere]">
                <EmailText email={email} />
              </p>
              <SignOutForm />
            </div>
          </div>
        </aside>

        <div className="flex min-h-svh min-w-0 flex-col">
          {/*
            Phone and tablet header and menu (below lg). Open, the two become one
            fixed layer over the page: top-0 and bottom-0 follow the visible
            viewport on iOS as the browser bars show and hide, which no vh unit
            does exactly. The header row stays put; below it the whole menu
            (every link, then the account block) scrolls as one column, so
            nothing is pinned over the links.
          */}
          <div
            className={cn(
              'shrink-0 lg:hidden',
              mobileOpen && 'fixed inset-0 z-40 flex flex-col bg-background',
            )}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-black/8 px-6 py-4">
              <p className="intel-eyebrow text-cobalt-text">
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
                // Bottom padding clears the browser toolbar and home indicator.
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]"
              >
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
                <div className="mt-8 space-y-3 border-t border-black/8 pt-8">
                  <p className="intel-secondary text-meta [overflow-wrap:anywhere]">
                    <EmailText email={email} />
                  </p>
                  <SignOutForm />
                </div>
              </nav>
            ) : null}
          </div>

          {/*
            Content width is set here, once, for every Intel page (Reports
            renders this shell too). Expanded: centred, capped at 1200px, as
            before. Collapsed at lg: the cap lifts to the full window and the
            left padding grows to clear the fixed toggle (44px wide), so the
            page title sits on the toggle's row without overlapping it. Width
            and padding animate with the 200 ms sidebar column.

            Collapsed only, paragraphs are capped at 70rem, the widest a line
            could run in the expanded layout (1200px less the 40px gutters),
            so no single text block stretches across a wide window.
          */}
          <main
            data-sidebar={collapsed ? 'collapsed' : 'expanded'}
            className={cn(
              'intel-body min-w-0 flex-1 px-6 py-6 md:px-8 md:py-8 lg:px-10',
              'lg:transition-[padding] lg:duration-200 lg:ease-out motion-reduce:transition-none',
              collapsed && 'lg:pl-16',
            )}
          >
            <div
              className={cn(
                'mx-auto w-full min-w-0 max-w-[1200px]',
                'lg:transition-[max-width] lg:duration-200 lg:ease-out motion-reduce:transition-none',
                collapsed && 'lg:max-w-full lg:[&_p]:max-w-[70rem]',
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
