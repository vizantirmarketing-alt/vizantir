'use client'

import Link from 'next/link'
import { PortableText, toPlainText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

type PortableTextRendererProps = {
  value: PortableTextBlock[] | undefined | null
}

function isInternalHref(href: string): boolean {
  const h = href.trim()
  if (!h) return false
  if (h.startsWith('/') || h.startsWith('#')) return true
  if (/^https?:\/\/(www\.)?vizantir\.com($|\/|\?|#)/i.test(h)) return true
  if (/^\/\/(www\.)?vizantir\.com($|\/|\?|#)/i.test(h)) return true
  return false
}

function toInternalLinkHref(href: string): string {
  if (href.startsWith('/') || href.startsWith('#')) return href
  try {
    const u = new URL(href)
    if (u.hostname.replace(/^www\./i, '') === 'vizantir.com') {
      const path = `${u.pathname}${u.search}${u.hash}`
      return path || '/'
    }
  } catch {
    // ignore
  }
  return href
}

/** True when Portable Text has visible text, not just empty blocks. */
export function hasPortableTextContent(value: unknown): value is PortableTextBlock[] {
  if (!Array.isArray(value) || value.length === 0) return false
  return toPlainText(value as PortableTextBlock[]).trim().length > 0
}

/** Shared Portable Text mapping (blog, case studies, services). */
export const vizantirPortableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4 text-foreground">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl md:text-2xl font-semibold mt-8 mb-3 text-foreground">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg md:text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="my-4 text-base md:text-lg leading-relaxed text-foreground/90">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 my-6 italic text-foreground/80">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-outside ml-6 my-4 space-y-2 text-foreground/90">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-outside ml-6 my-4 space-y-2 text-foreground/90">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="text-base md:text-lg leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="text-base md:text-lg leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-sm font-mono">{children}</code>
    ),
    link: ({ value, children }) => {
      const href = typeof value?.href === 'string' ? value.href : ''
      if (!href) return <span>{children}</span>
      const className = 'link-cobalt'
      if (isInternalHref(href)) {
        return (
          <Link href={toInternalLinkHref(href)} className={className}>
            {children}
          </Link>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      )
    },
  },
  types: {
    codeBlock: ({ value }) => {
      const code = typeof value?.code === 'string' ? value.code : ''
      if (!code.trim()) return null
      const filename = typeof value?.filename === 'string' ? value.filename : undefined

      return (
        <div className="my-6 rounded-lg overflow-hidden bg-neutral-900 text-neutral-100">
          {filename ? (
            <div className="px-4 py-2 text-xs font-mono text-neutral-400 border-b border-neutral-800">
              {filename}
            </div>
          ) : null}
          <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )
    },
  },
}

export function PortableTextRenderer({ value }: PortableTextRendererProps) {
  if (!hasPortableTextContent(value)) return null
  return <PortableText value={value} components={vizantirPortableTextComponents} />
}
