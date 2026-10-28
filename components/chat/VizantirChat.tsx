'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MessageCircle, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const GREETING =
  'I\'m the Vizantir concierge. Ask me about our services, pricing, process, or the kind of work we do.';

const STARTER_PROMPTS = [
  'How much does a website cost?',
  'What kind of businesses do you work with?',
  "What's your process?",
] as const;

const MAX_INPUT_LENGTH = 2000;
const ERROR_MESSAGE = 'Something went wrong, please try again.';
const LAUNCHER_LABEL = 'Questions? Talk to us';
const LAUNCHER_SCROLL_PX = 200;

const QUICK_ACTIONS = [
  { label: 'Services', href: '/services' },
  { label: 'Landing page pricing', href: '/landing-pages' },
] as const;

const VIZANTIR_URL_PATTERN =
  /(?:https?:\/\/|\/\/)?(?:www\.)?vizantir\.com(?![A-Za-z0-9-])(?!\.[A-Za-z0-9-])(?:(?:\/|[?#])[^\s<>"'`]*)?/gi;

const EMAIL_PATTERN = /[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?![A-Za-z0-9._+-])/;

const PHONE_PATTERN =
  /\+\d{1,3}[ \t\u00a0]*\(?\d{3}\)?[ \t\u00a0.-]*\d{3}[ \t\u00a0.-]*\d{4}(?!\d)/;

const LINKIFY_PATTERN = new RegExp(
  `(?<email>${EMAIL_PATTERN.source})|(?<phone>${PHONE_PATTERN.source})|(?<url>${VIZANTIR_URL_PATTERN.source})`,
  'gi',
);

const TRAILING_URL_PUNCTUATION = /[.,;:!?…]+$/;

const EMAIL_HOST = 'vizantir.com';

const MESSAGE_LINK_CLASS =
  'link-ui break-words text-cobalt-text';

type AssistantTextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string }
  | { type: 'external'; value: string; href: string };

function countChar(value: string, char: string): number {
  let count = 0;
  for (const current of value) {
    if (current === char) count += 1;
  }
  return count;
}

function trimUrlTail(raw: string): string {
  let value = raw.replace(TRAILING_URL_PUNCTUATION, '');

  while (value.endsWith(')') && countChar(value, ')') > countChar(value, '(')) {
    value = value.slice(0, -1);
  }
  while (value.endsWith(']') && countChar(value, ']') > countChar(value, '[')) {
    value = value.slice(0, -1);
  }
  while (value.endsWith('}') && countChar(value, '}') > countChar(value, '{')) {
    value = value.slice(0, -1);
  }

  return value.replace(TRAILING_URL_PUNCTUATION, '');
}

function hasSafeUrlBoundary(text: string, start: number): boolean {
  if (start === 0) return true;
  return !/[A-Za-z0-9@./-]/.test(text.charAt(start - 1));
}

function hasSafePhoneBoundary(text: string, start: number): boolean {
  if (start === 0) return true;
  return !/[0-9+]/.test(text.charAt(start - 1));
}

function toMailtoHref(rawEmail: string): string | null {
  const atIndex = rawEmail.lastIndexOf('@');
  if (atIndex <= 0) return null;

  const local = rawEmail.slice(0, atIndex);
  const host = rawEmail.slice(atIndex + 1).toLowerCase();
  if (host !== EMAIL_HOST) return null;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;

  return `mailto:${local}@${host}`;
}

function toTelHref(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return `tel:+${digits}`;
}

function toInternalPath(rawUrl: string): string | null {
  const withProtocol = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : rawUrl.startsWith('//')
      ? `https:${rawUrl}`
      : `https://${rawUrl}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== 'vizantir.com' && host !== 'www.vizantir.com') return null;

  const hostIndex = withProtocol.toLowerCase().indexOf(host);
  if (hostIndex === -1) return null;

  const suffix = withProtocol.slice(hostIndex + host.length);
  if (suffix.includes('\\') || suffix.startsWith('//')) return null;
  if (suffix === '') return '/';
  if (suffix.startsWith('/')) return suffix;
  if (suffix.startsWith('?') || suffix.startsWith('#')) return `/${suffix}`;
  return null;
}

function resolveMatchPart(
  content: string,
  streaming: boolean,
  start: number,
  raw: string,
  groups: Record<string, string | undefined> | undefined,
): AssistantTextPart | null {
  const rawEnd = start + raw.length;

  if (groups?.email !== undefined) {
    if (!hasSafeUrlBoundary(content, start)) return null;
    if (streaming && rawEnd === content.length) return null;

    const href = toMailtoHref(raw);
    if (!href) return null;

    return { type: 'external', value: raw, href };
  }

  if (groups?.phone !== undefined) {
    if (!hasSafePhoneBoundary(content, start)) return null;
    if (streaming && rawEnd === content.length) return null;

    const href = toTelHref(raw);
    if (!href) return null;

    return { type: 'external', value: raw, href };
  }

  if (!hasSafeUrlBoundary(content, start)) return null;

  const label = trimUrlTail(raw);
  if (!label) return null;

  const stillGrowing = streaming && rawEnd === content.length && label.length === raw.length;
  if (stillGrowing) return null;

  const href = toInternalPath(label);
  if (!href) return null;

  return { type: 'link', value: label, href };
}

function linkifyAssistantText(content: string, streaming: boolean): AssistantTextPart[] {
  const parts: AssistantTextPart[] = [];
  const pattern = new RegExp(LINKIFY_PATTERN.source, 'gi');
  let cursor = 0;

  for (const match of content.matchAll(pattern)) {
    const start = match.index;
    if (start === undefined || start < cursor) continue;

    const part = resolveMatchPart(content, streaming, start, match[0], match.groups);
    if (part === null) continue;

    if (start > cursor) {
      parts.push({ type: 'text', value: content.slice(cursor, start) });
    }

    parts.push(part);
    cursor = start + part.value.length;
  }

  if (cursor < content.length) {
    parts.push({ type: 'text', value: content.slice(cursor) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', value: content });
  }

  return parts;
}

function findQuickActionAnchorIndex(messages: readonly ChatMessage[], isStreaming: boolean): number {
  let anchor = -1;
  let hasCompletedAssistantReply = false;

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message === undefined || message.role !== 'assistant' || message.content === '') continue;

    const isLiveReply = isStreaming && index === messages.length - 1;
    if (!isLiveReply) hasCompletedAssistantReply = true;
    anchor = index;
  }

  return hasCompletedAssistantReply ? anchor : -1;
}

function AssistantMessageBody({ content, streaming }: { content: string; streaming: boolean }) {
  return linkifyAssistantText(content, streaming).map((part, index) => {
    if (part.type === 'text') {
      return <span key={index}>{part.value}</span>;
    }

    if (part.type === 'external') {
      return (
        <a key={index} href={part.href} className={MESSAGE_LINK_CLASS}>
          {part.value}
        </a>
      );
    }

    return (
      <Link key={index} href={part.href} className={MESSAGE_LINK_CLASS}>
        {part.value}
      </Link>
    );
  });
}

function QuickActionChips() {
  return (
    <div className="flex w-full flex-wrap gap-2">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="rounded-full border border-cobalt-muted-border bg-cobalt-muted-subtle px-3 py-1 text-xs text-foreground transition-colors hover:border-cobalt-primary hover:bg-cobalt-primary/20"
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}

const subscribeNoop = () => () => {};
const getMountedClient = () => true;
const getMountedServer = () => false;

export function VizantirChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const mounted = useSyncExternalStore(subscribeNoop, getMountedClient, getMountedServer);
  const [isMobile, setIsMobile] = useState(false);
  const [pastScroll, setPastScroll] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const [pillWidth, setPillWidth] = useState(0);
  const [canAnimate, setCanAnimate] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const launcherLabelRef = useRef<HTMLSpanElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia(
      '(max-width: 768px), (max-height: 600px) and (pointer: coarse)'
    );

    const checkMobile = () => setIsMobile(mobileQuery.matches);

    checkMobile();
    mobileQuery.addEventListener('change', checkMobile);
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      mobileQuery.removeEventListener('change', checkMobile);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const onScroll = () => setPastScroll(window.scrollY >= LAUNCHER_SCROLL_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('[data-site-footer]');
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => {
      setFooterInView(entry?.isIntersecting ?? false);
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const label = launcherLabelRef.current;
    if (!label) return;

    const measure = () => {
      const next = Math.ceil(label.offsetWidth);
      setPillWidth((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(label);
    const frame = requestAnimationFrame(() => setCanAnimate(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [mounted]);

  // Panel header close is the only close control: focus it on open, return focus to the launcher on close.
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setHasOpened(true);
    }
    setIsOpen((prev) => !prev);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = { role: 'user', content: trimmed.slice(0, MAX_INPUT_LENGTH) };
      const nextMessages = [...messages, userMessage];

      setMessages(nextMessages);
      setInput('');
      setIsStreaming(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages }),
        });

        if (!response.ok) {
          let errorContent = ERROR_MESSAGE;
          try {
            const data = (await response.json()) as { error?: string };
            if (data.error) errorContent = data.error;
          } catch {
            // use default error message
          }
          setMessages((prev) => [...prev, { role: 'assistant', content: errorContent }]);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setMessages((prev) => [...prev, { role: 'assistant', content: ERROR_MESSAGE }]);
          return;
        }

        const decoder = new TextDecoder();
        let assistantContent = '';

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          assistantContent += decoder.decode(value, { stream: true });
          const content = assistantContent;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content };
            return updated;
          });
        }
      } catch {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: ERROR_MESSAGE };
            return updated;
          }
          return [...prev, { role: 'assistant', content: ERROR_MESSAGE }];
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages]
  );

  const handleSend = () => sendMessage(input);

  const handleClearConversation = () => {
    setMessages([]);
    setInput('');
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActionAnchorIndex = findQuickActionAnchorIndex(messages, isStreaming);

  if (!mounted) return null;

  const showEmptyState = messages.length === 0;

  const panel = hasOpened && isOpen && (
    createPortal(
      <div
        className={cn(
          'fixed z-[9998] flex flex-col overflow-hidden bg-background font-sans',
          'border border-border shadow-2xl',
          isMobile
            ? 'inset-0'
            : 'bottom-24 right-6 h-[600px] max-h-[min(600px,calc(100dvh-8rem))] w-[400px] max-w-[calc(100vw-3rem)] rounded-2xl'
        )}
        style={
          isMobile
            ? {
                height: '100dvh',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                overscrollBehavior: 'none',
                touchAction: 'pan-y',
              }
            : { overscrollBehavior: 'none' }
        }
        role="dialog"
        aria-label="Vizantir concierge chat"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-[#1A1A1A] px-4 py-3 text-white">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Vizantir Concierge</h2>
            <p className="text-xs text-white/60">Premium web design studio</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex size-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {showEmptyState && (
            <div className="space-y-3">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                  {GREETING}
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-cobalt-muted-border bg-cobalt-muted-subtle px-4 py-2 text-left text-sm text-foreground transition-colors hover:border-cobalt-primary hover:bg-cobalt-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isEmptyStreaming =
              isStreaming &&
              index === messages.length - 1 &&
              message.role === 'assistant' &&
              message.content === '';
            if (isEmptyStreaming) return null;

            const isLiveAssistantMessage =
              isStreaming && index === messages.length - 1 && message.role === 'assistant';

            return (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'flex flex-col gap-2',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'rounded-br-md bg-cobalt-primary text-white'
                      : 'rounded-bl-md bg-muted text-foreground'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <AssistantMessageBody
                      content={message.content}
                      streaming={isLiveAssistantMessage}
                    />
                  ) : (
                    message.content
                  )}
                </div>
                {index === quickActionAnchorIndex ? <QuickActionChips /> : null}
              </div>
            );
          })}

          {isStreaming &&
            (messages.length === 0 ||
              messages[messages.length - 1]?.role !== 'assistant' ||
              messages[messages.length - 1]?.content === '') && (
              <div className="flex justify-start">
                <div className="chat-composing rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="size-1.5 animate-bounce rounded-full bg-cobalt-primary"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        <p className="shrink-0 px-4 py-1.5 text-center text-xs text-muted-foreground opacity-60">
          Powered by Vizantir
        </p>

        {/* Input footer */}
        <footer className="shrink-0 border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              disabled={isStreaming}
              className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cobalt-primary focus:outline-none focus:ring-2 focus:ring-cobalt-focus disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cobalt-primary text-white shadow-cobalt transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>
          <div className="flex justify-center px-4 pb-2">
            <button
              type="button"
              onClick={handleClearConversation}
              disabled={messages.length === 0}
              className={cn(
                'text-xs text-muted-foreground transition-colors hover:text-foreground',
                messages.length === 0 && 'pointer-events-none opacity-40'
              )}
            >
              Clear chat
            </button>
          </div>
        </footer>
      </div>,
      document.body
    )
  );

  const showPill = !pastScroll;
  const pillWidthPx = pillWidth > 0 ? pillWidth : undefined;

  return (
    <>
      <div
        aria-hidden={footerInView || undefined}
        className={cn(
          'pointer-events-none fixed bottom-6 right-6 z-[9999]',
          canAnimate && 'transition-transform duration-200 ease-[ease] motion-reduce:transition-none',
          footerInView && 'translate-y-[calc(100%+1.5rem)]',
        )}
      >
        <button
          ref={launcherRef}
          type="button"
          onClick={handleToggle}
          aria-label="Open chat"
          tabIndex={footerInView || isOpen ? -1 : undefined}
          style={
            {
              '--chat-pill-width': pillWidthPx ? `${pillWidthPx}px` : '13.75rem',
              // Overrides the cobalt button transition so the pill width still animates.
              ...(canAnimate && {
                transition:
                  'width 200ms ease, box-shadow 150ms ease-out, transform 150ms ease-out, background 200ms ease-out',
              }),
            } as CSSProperties
          }
          className={cn(
            'group bg-cobalt-gradient relative flex h-10 w-10 items-center justify-center rounded-xl font-sans text-base font-semibold text-white shadow-cobalt',
            isOpen && 'invisible',
            showPill && 'md:w-[var(--chat-pill-width)]',
            !isOpen && pastScroll && 'md:hover:w-[var(--chat-pill-width)] md:focus-visible:w-[var(--chat-pill-width)]',
            footerInView ? 'pointer-events-none' : 'pointer-events-auto',
          )}
        >
          <span
            ref={launcherLabelRef}
            aria-hidden
            className={cn(
              'pointer-events-none absolute! top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 px-4 whitespace-nowrap',
              canAnimate && 'transition-opacity duration-200 ease-[ease] motion-reduce:transition-none',
              'opacity-0',
              showPill && 'md:opacity-100',
              !isOpen && pastScroll && 'md:group-hover:opacity-100 md:group-focus-visible:opacity-100',
            )}
          >
            {LAUNCHER_LABEL}
          </span>
          <MessageCircle
            aria-hidden
            strokeWidth={1.5}
            className={cn(
              'absolute! top-1/2 left-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2',
              canAnimate && 'transition-opacity duration-200 ease-[ease] motion-reduce:transition-none',
              'opacity-100',
              showPill && 'md:opacity-0',
              !isOpen && pastScroll && 'md:group-hover:opacity-0 md:group-focus-visible:opacity-0',
            )}
          />
        </button>
      </div>

      {panel}
    </>
  );
}
