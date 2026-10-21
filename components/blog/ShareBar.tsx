'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import posthog from 'posthog-js'

type ShareBarProps = {
  title: string
  url: string
}

type ShareChannel = 'x' | 'facebook' | 'linkedin' | 'copy' | 'native'

const pillClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-muted-foreground transition-colors duration-500 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2'

function trackShare(channel: ShareChannel, url: string) {
  if (!posthog.__loaded) return
  posthog.capture('blog_share', { channel, url })
}

function subscribeToNativeShare() {
  return () => {}
}

function getNativeShareSnapshot() {
  return typeof navigator.share === 'function'
}

function getNativeShareServerSnapshot() {
  return false
}

function legacyCopy(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, value.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }

  if (!ok) {
    throw new Error('copy failed')
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      legacyCopy(value)
      return
    }
  }

  legacyCopy(value)
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-.9 1.1-.9H17V3.4h-2.3C12.1 3.4 11 4.8 11 6.9v1.6H9V11h2v8.5h3V11h2.2l.3-2.5h-2.5Z" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M5.7 9H3.2V21h2.5V9ZM4.4 3.4a1.55 1.55 0 1 0 .02 3.1 1.55 1.55 0 0 0-.02-3.1ZM20.8 21h-2.5v-5.8c0-1.7-.6-2.8-2.1-2.8-1.1 0-1.8.8-2.1 1.5-.1.3-.1.7-.1 1V21h-2.5V9h2.4v1.6c.4-.7 1.4-1.8 3.4-1.8 2.4 0 4.2 1.6 4.2 5V21Z" />
    </svg>
  )
}

function IconLink() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07l-1.1 1.09" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-1.92 1.92a5 5 0 0 0 7.07 7.07l1.09-1.09" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  )
}

export function ShareBar({ title, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false)
  const canNativeShare = useSyncExternalStore(
    subscribeToNativeShare,
    getNativeShareSnapshot,
    getNativeShareServerSnapshot,
  )
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const links = [
    {
      channel: 'x' as const,
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <IconX />,
    },
    {
      channel: 'facebook' as const,
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <IconFacebook />,
    },
    {
      channel: 'linkedin' as const,
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <IconLinkedIn />,
    },
  ]

  function markCopied() {
    setCopied(true)
    if (resetTimer.current !== null) {
      clearTimeout(resetTimer.current)
    }
    resetTimer.current = setTimeout(() => {
      setCopied(false)
      resetTimer.current = null
    }, 2000)
  }

  async function onCopy() {
    trackShare('copy', url)
    try {
      await copyText(url)
      markCopied()
    } catch {
      setCopied(false)
    }
  }

  async function onNativeShare() {
    trackShare('native', url)
    try {
      await navigator.share({ title, url })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  return (
    <section className="mt-12">
      <p className="mb-3 text-sm text-muted-foreground transition-colors duration-500">
        Share this article
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.channel}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            data-share-channel={link.channel}
            className={pillClassName}
            onClick={() => trackShare(link.channel, url)}
          >
            {link.icon}
            {link.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
        <button
          type="button"
          data-share-channel="copy"
          className={pillClassName}
          onClick={onCopy}
        >
          <IconLink />
          <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
        </button>
        {canNativeShare ? (
          <button
            type="button"
            data-share-channel="native"
            className={pillClassName}
            aria-label="More sharing options"
            onClick={onNativeShare}
          >
            <IconShare />
            More
          </button>
        ) : null}
      </div>
    </section>
  )
}
