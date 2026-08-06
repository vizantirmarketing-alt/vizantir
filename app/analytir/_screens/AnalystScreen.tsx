import { Monitor, Send, X } from 'lucide-react'

type Message = {
  role: 'me' | 'them'
  text: string
}

const MESSAGES: Message[] = [
  {
    role: 'me',
    text: 'Why did only $996.97 hit my account when I sold $1,207.80?',
  },
  {
    role: 'them',
    text: 'Three deductions. Processing fees took $29.66, and 15% of your card volume, $181.17, went to your Square Loan repayment.',
  },
  {
    role: 'them',
    text: 'That loan withholding is automatic and does not appear on your sales report. It is the largest gap between what you sold and what you banked.',
  },
  {
    role: 'me',
    text: 'How long until it is paid off?',
  },
]

export function AnalystScreen() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        flexShrink: 0,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 24px 60px rgba(0,0,0,.16)',
        overflow: 'hidden',
        fontFamily: 'var(--font-analytir-sans)',
      }}
    >
      <div className="flex items-start gap-3 px-[15px] pt-[15px] pb-3 md:px-5 md:pt-5 md:pb-4">
        <div
          className="flex shrink-0 items-center justify-center rounded-[10px]"
          style={{ width: 36, height: 36, background: '#f4f4f5' }}
        >
          <Monitor size={18} style={{ color: '#52525b' }} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold" style={{ fontSize: 15, color: '#0a0a0a' }}>
            AI Analyst
          </div>
          <div style={{ fontSize: 12.5, color: '#71717a' }}>
            Ask me anything about your data
          </div>
        </div>
        <X size={16} style={{ color: '#a1a1aa' }} aria-hidden />
      </div>

      <div className="flex flex-col gap-4 px-[15px] pt-[3px] pb-1.5 md:px-5 md:pt-1 md:pb-2">
        {MESSAGES.map((message, index) => {
          const isMe = message.role === 'me'
          return (
            <div
              key={message.text}
              className={
                index >= 3
                  ? isMe
                    ? 'hidden self-end md:block'
                    : 'hidden self-start md:block'
                  : isMe
                    ? 'self-end'
                    : 'self-start'
              }
              style={{
                background: isMe ? '#8b5cf6' : '#f4f4f5',
                color: isMe ? '#fff' : '#18181b',
                borderRadius: 16,
                borderBottomRightRadius: isMe ? 6 : 16,
                borderBottomLeftRadius: isMe ? 16 : 6,
                padding: '12px 14px',
                fontSize: 13.5,
                lineHeight: 1.55,
                maxWidth: '88%',
                wordBreak: 'break-word',
              }}
            >
              {message.text}
            </div>
          )
        })}
      </div>

      <div className="px-[15px] pt-1.5 pb-[15px] md:px-5 md:pt-2 md:pb-5">
        <div className="flex items-center gap-2">
          <div
            className="flex flex-1 items-center"
            style={{
              height: 46,
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: '0 14px',
              fontSize: 13.5,
              color: '#a1a1aa',
            }}
          >
            Ask about your data...
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: '#a78bfa',
            }}
            aria-label="Send"
          >
            <Send size={18} color="#fff" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
