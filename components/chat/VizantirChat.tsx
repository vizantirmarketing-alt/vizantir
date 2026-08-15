'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
const GREETING_TOOLTIP_SESSION_KEY = 'vizantir-chat-greeting-seen';
const SCROLL_GREETING_THRESHOLD = 0.5;

export function VizantirChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGreetingTooltip, setShowGreetingTooltip] = useState(false);
  const [greetingBlocked, setGreetingBlocked] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const markGreetingSeen = useCallback(() => {
    sessionStorage.setItem(GREETING_TOOLTIP_SESSION_KEY, '1');
    setGreetingBlocked(true);
    setShowGreetingTooltip(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    setGreetingBlocked(sessionStorage.getItem(GREETING_TOOLTIP_SESSION_KEY) === '1');
  }, []);

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
    if (isOpen) markGreetingSeen();
  }, [isOpen, markGreetingSeen]);

  useEffect(() => {
    if (greetingBlocked || isOpen) return;

    const checkScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      if (window.scrollY / scrollable >= SCROLL_GREETING_THRESHOLD) {
        sessionStorage.setItem(GREETING_TOOLTIP_SESSION_KEY, '1');
        setGreetingBlocked(true);
        setShowGreetingTooltip(true);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    return () => window.removeEventListener('scroll', checkScroll);
  }, [greetingBlocked, isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setHasOpened(true);
      markGreetingSeen();
    }
    setIsOpen((prev) => !prev);
  };

  const dismissGreetingTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    markGreetingSeen();
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

            return (
              <div
                key={`${message.role}-${index}`}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'rounded-br-md bg-cobalt-primary text-white'
                      : 'rounded-bl-md bg-muted text-foreground'
                  )}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {isStreaming &&
            (messages.length === 0 ||
              messages[messages.length - 1]?.role !== 'assistant' ||
              messages[messages.length - 1]?.content === '') && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
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

  return (
    <>
      <div className="pointer-events-none fixed bottom-6 right-6 z-[9999]">
        <AnimatePresence>
          {!isOpen && showGreetingTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 8, x: 8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 8, x: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto absolute bottom-[calc(100%+0.75rem)] right-0 w-max max-w-[min(240px,calc(100vw-5rem))]"
              role="status"
            >
              <div className="relative rounded-xl border border-cobalt-muted-border bg-background px-3.5 py-2.5 pr-8 text-sm text-foreground shadow-lg">
                <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-cobalt-primary" aria-hidden />
                <p className="pl-2 leading-snug">Hi! How can I help?</p>
                <button
                  type="button"
                  onClick={dismissGreetingTooltip}
                  className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss greeting"
                >
                  <X className="size-3" />
                </button>
                <span
                  className="absolute -bottom-1.5 right-5 size-3 rotate-45 border-r border-b border-cobalt-muted-border bg-background"
                  aria-hidden
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <button
            type="button"
            onClick={handleToggle}
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-cobalt-primary text-white shadow-cobalt transition-all hover:scale-105 hover:brightness-105 active:scale-95"
            aria-label="Open chat"
          >
            <MessageCircle className="size-6" />
          </button>
        )}
      </div>

      {panel}
    </>
  );
}
