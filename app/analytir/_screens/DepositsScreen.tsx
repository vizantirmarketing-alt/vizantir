import { ChevronDown, ChevronRight } from 'lucide-react'

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-analytir-mono)',
  fontVariantNumeric: 'tabular-nums',
}

type ChildPayout = {
  label: string
  amount: string
}

type Week = {
  label: string
  count: string
  amount: string
  expanded: boolean
  children?: ChildPayout[]
}

const WEEKS: Week[] = [
  {
    label: 'Week of Aug 3 – Aug 9',
    count: '2 payouts',
    amount: '$312.03',
    expanded: true,
    children: [
      { label: 'Sent Aug 3 · Arriving Aug 4', amount: '$123.82' },
      { label: 'Sent Aug 4 · Arriving Aug 5', amount: '$188.21' },
    ],
  },
  {
    label: 'Week of Jul 27 – Aug 2',
    count: '7 payouts',
    amount: '$1,323.04',
    expanded: true,
    children: [
      { label: 'Sent Jul 27 · Arriving Jul 28', amount: '$188.62' },
      { label: 'Sent Jul 28 · Arriving Jul 29', amount: '$449.48' },
      { label: 'Sent Jul 29 · Arriving Jul 30', amount: '$45.40' },
      { label: 'Sent Jul 30 · Arriving Jul 31', amount: '$177.48' },
      { label: 'Sent Aug 2 · Arriving Aug 3', amount: '$122.58' },
    ],
  },
  {
    label: 'Week of Jul 20 – Jul 26',
    count: '5 payouts',
    amount: '$934.18',
    expanded: false,
  },
  {
    label: 'Week of Jul 13 – Jul 19',
    count: '6 payouts',
    amount: '$1,496.84',
    expanded: false,
  },
]

export function DepositsScreen() {
  return (
    <div style={{ width: '100%', padding: '26px 30px', boxSizing: 'border-box' }}>
      <div
        className="uppercase tracking-[0.16em] text-[10px] md:text-[11px]"
        style={{ ...mono, color: '#a1a1aa' }}
      >
        DEPOSITS
      </div>
      <div className="text-[13px] md:text-[14px]" style={{ color: '#71717a' }}>
        72 payouts · sent May 7–Aug 4, arriving May 8–Aug 5
      </div>

      <div className="mt-4">
        {WEEKS.map((week, index) => {
          const Chevron = week.expanded ? ChevronDown : ChevronRight
          const mobileCollapsed = index === 1
          const hideOnMobile = index >= 2
          return (
            <div key={week.label} className={hideOnMobile ? 'hidden md:block' : undefined}>
              <div
                className="flex items-center justify-between py-2.5 md:py-3.5"
                style={{ borderTop: '1px solid #e8e8ea' }}
              >
                <div className="flex items-center gap-2">
                  {mobileCollapsed ? (
                    <>
                      <ChevronRight
                        size={14}
                        className="md:hidden"
                        style={{ color: '#a1a1aa' }}
                        aria-hidden
                      />
                      <Chevron
                        size={14}
                        className="hidden md:block"
                        style={{ color: '#a1a1aa' }}
                        aria-hidden
                      />
                    </>
                  ) : (
                    <Chevron size={14} style={{ color: '#a1a1aa' }} aria-hidden />
                  )}
                  <span
                    className="font-medium text-[14px] md:text-[15px]"
                    style={{ color: '#0a0a0a' }}
                  >
                    {week.label}
                  </span>
                  <span
                    className="text-[13px] md:text-[14px]"
                    style={{ color: '#a1a1aa' }}
                  >
                    {week.count}
                  </span>
                </div>
                <span
                  className="shrink-0 text-[14px] md:text-[15px]"
                  style={{ ...mono, color: '#0a0a0a', marginLeft: 12 }}
                >
                  {week.amount}
                </span>
              </div>
              {week.expanded && week.children ? (
                <div
                  className={mobileCollapsed ? 'hidden md:block' : undefined}
                  style={{
                    background: '#fafafa',
                    borderLeft: '2px solid #e8e8ea',
                    marginLeft: 16,
                  }}
                >
                  {week.children.map((child) => (
                    <div
                      key={child.label}
                      className="flex items-center justify-between py-2.5 pl-4 pr-3 text-[13px] md:text-[14px]"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight size={12} style={{ color: '#a1a1aa' }} aria-hidden />
                        <span style={{ color: '#0a0a0a' }}>{child.label}</span>
                      </div>
                      <span
                        className="shrink-0 text-[13px] md:text-[14px]"
                        style={{ ...mono, color: '#0a0a0a', marginLeft: 12 }}
                      >
                        {child.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
