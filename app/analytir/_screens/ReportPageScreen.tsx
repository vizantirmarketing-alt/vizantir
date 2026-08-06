const rows = [
  { month: 'April', thursday: '$85.39', other: '$90.35', gap: '-$4.96' },
  { month: 'May', thursday: '$81.09', other: '$102.43', gap: '-$21.34' },
  { month: 'June', thursday: '$83.77', other: '$135.36', gap: '-$51.58' },
] as const

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--font-analytir-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#a1a1aa',
}

const numericCell: React.CSSProperties = {
  fontFamily: 'var(--font-analytir-mono)',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  padding: '11px 0',
  borderBottom: '1px solid #f4f4f5',
}

export function ReportPageScreen() {
  return (
    <div
      className="px-[22px] pt-7 pb-6 md:px-12 md:pt-11 md:pb-9"
      style={{
        maxWidth: 620,
        margin: '0 auto',
        background: '#ffffff',
        boxShadow: '0 1px 2px rgba(0,0,0,.05), 0 20px 50px rgba(0,0,0,.10)',
        fontFamily: 'var(--font-analytir-sans)',
      }}
    >
      <div
        className="flex items-baseline justify-between"
        style={{
          borderBottom: '1px solid #e8e8ea',
          paddingBottom: 14,
          marginBottom: 28,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-analytir-mono)',
              fontSize: 12,
              letterSpacing: '0.18em',
              color: '#0a0a0a',
            }}
          >
            ANALYTIR
          </span>
          <span style={{ fontSize: 13, color: '#71717a' }}> Willow & Vine</span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-analytir-mono)',
            fontSize: 12,
            color: '#a1a1aa',
          }}
        >
          July 9, 2026
        </span>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-analytir-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          color: '#a1a1aa',
          marginBottom: 10,
        }}
      >
        OPPORTUNITY: THE THURSDAY GAP
      </div>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: '#3f3f46',
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        While you&apos;re growing, there&apos;s still room to improve. Thursday
        has consistently underperformed.
      </p>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...monoLabel,
                textAlign: 'left',
                paddingBottom: 10,
                borderBottom: '1px solid #e8e8ea',
                fontWeight: 400,
              }}
            >
              Month
            </th>
            <th
              className="hidden md:table-cell"
              style={{
                ...monoLabel,
                textAlign: 'right',
                paddingBottom: 10,
                borderBottom: '1px solid #e8e8ea',
                fontWeight: 400,
              }}
            >
              Thursday Avg
            </th>
            <th
              className="hidden md:table-cell"
              style={{
                ...monoLabel,
                textAlign: 'right',
                paddingBottom: 10,
                borderBottom: '1px solid #e8e8ea',
                fontWeight: 400,
              }}
            >
              Other Days Avg
            </th>
            <th
              style={{
                ...monoLabel,
                textAlign: 'right',
                paddingBottom: 10,
                borderBottom: '1px solid #e8e8ea',
                fontWeight: 400,
              }}
            >
              Weekly Gap
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td
                style={{
                  fontSize: 14,
                  color: '#18181b',
                  padding: '11px 0',
                  borderBottom: '1px solid #f4f4f5',
                }}
              >
                {row.month}
              </td>
              <td className="hidden md:table-cell" style={numericCell}>
                {row.thursday}
              </td>
              <td className="hidden md:table-cell" style={numericCell}>
                {row.other}
              </td>
              <td style={{ ...numericCell, color: '#b91c1c' }}>{row.gap}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p
        style={{
          marginTop: 22,
          marginBottom: 0,
          fontSize: 15,
          lineHeight: 1.6,
          color: '#18181b',
        }}
      >
        The Thursday gap has grown from $4.96/week to $51.58/week across three months.
        That is $223/month in lost revenue, and it is widening.
      </p>

      <div className="hidden md:block" style={{ borderTop: '1px solid #e8e8ea', margin: '30px 0 24px' }} />

      <div className="hidden md:block">
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#0a0a0a',
            marginBottom: 8,
          }}
        >
          2. Launch a Thursday promotion
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: '#3f3f46',
            margin: 0,
          }}
        >
          15% off or bonus service on Thursdays. You have a consistent, measurable
          gap to fill. The data shows this has been growing for three months. It
          will not fix itself.
        </p>
        <div
          className="flex"
          style={{ marginTop: 14, gap: 32, fontSize: 13 }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-analytir-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                color: '#a1a1aa',
              }}
            >
              Deadline
            </div>
            <div style={{ fontSize: 13, color: '#18181b' }}>
              Announce Monday, start Thursday
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-analytir-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                color: '#a1a1aa',
              }}
            >
              Impact
            </div>
            <div
              style={{
                fontFamily: 'var(--font-analytir-mono)',
                fontSize: 13,
                color: '#16a34a',
              }}
            >
              +$223/month
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 30,
          paddingTop: 14,
          borderTop: '1px solid #e8e8ea',
          fontSize: 11,
          color: '#a1a1aa',
        }}
      >
        Analysis based on transaction data. Month-over-month uses same calendar
        week.
      </div>
    </div>
  )
}
