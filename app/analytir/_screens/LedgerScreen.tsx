const mono: React.CSSProperties = {
  fontFamily: 'var(--font-analytir-mono)',
  fontVariantNumeric: 'tabular-nums',
}

type RowProps = {
  label: string
  value: React.ReactNode
  first?: boolean
  labelBold?: boolean
  valueColor?: string
}

function Row({ label, value, first, labelBold, valueColor }: RowProps) {
  return (
    <div
      className="flex items-baseline justify-between py-3 md:py-3.5"
      style={{
        fontSize: 16,
        borderTop: first ? undefined : '1px solid #e8e8ea',
      }}
    >
      <span
        style={{
          color: '#0a0a0a',
          fontWeight: labelBold ? 700 : 400,
        }}
      >
        {label}
      </span>
      <span
        className="shrink-0"
        style={{ ...mono, fontSize: 16, color: valueColor ?? '#0a0a0a', marginLeft: 16 }}
      >
        {value}
      </span>
    </div>
  )
}

export function LedgerScreen() {
  return (
    <div className="box-border w-full px-5 py-[22px] md:px-8 md:py-7">
      <div className="flex items-baseline justify-between">
        <span
          className="uppercase tracking-[0.16em]"
          style={{ ...mono, fontSize: 11, color: '#a1a1aa' }}
        >
          CASH FLOW
        </span>
        <span style={{ ...mono, fontSize: 13, color: '#71717a' }}>
          Jul 29 – Aug 4, 2026
        </span>
      </div>

      <div className="mt-6">
        <div
          className="uppercase"
          style={{ ...mono, fontSize: 11, color: '#a1a1aa' }}
        >
          SALES
        </div>
        <div style={{ fontSize: 14, color: '#71717a' }}>Jul 29 – Aug 4, 2026</div>
      </div>

      <div className="mt-2">
        <Row label="Total Collected" value="$1,207.80" first labelBold />
        <Row
          label="Processing Fees"
          value={
            <>
              <span style={{ color: '#b91c1c' }}>-$29.66</span>
              <span style={{ color: '#a1a1aa' }}> · 2.5%</span>
            </>
          }
        />
        <Row
          label="Loan repayments withheld"
          value={
            <>
              <span style={{ color: '#b91c1c' }}>-$181.17</span>
              <span style={{ color: '#a1a1aa' }}> · 15.0%</span>
            </>
          }
        />
        <div
          className="flex items-baseline justify-between"
          style={{
            borderTop: '1.5px solid #0a0a0a',
            marginTop: 6,
            paddingTop: 16,
            fontSize: 16,
          }}
        >
          <span style={{ color: '#0a0a0a', fontWeight: 700 }}>Net into bank</span>
          <span
            className="shrink-0"
            style={{
              ...mono,
              fontSize: 16,
              color: '#16a34a',
              fontWeight: 700,
              marginLeft: 16,
            }}
          >
            $996.97
          </span>
        </div>
      </div>
    </div>
  )
}
