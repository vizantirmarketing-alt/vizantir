import Image from 'next/image'

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-analytir-mono)',
  fontVariantNumeric: 'tabular-nums',
}

const CONTEXT_ROWS = [
  { label: 'Average week', value: '$1,961.72' },
  { label: 'Same week last month', value: '$3,105.90' },
] as const

const NEXT_STEPS = [
  'Check if your POS system is online and processing payments',
  'Verify Square API connection is active',
  'Review business hours and ensure you\'re open',
  'Check for any system outages or maintenance windows',
] as const

export function AlertEmailScreen() {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,.05), 0 20px 50px rgba(0,0,0,.10)',
        fontFamily: 'var(--font-analytir-sans)',
      }}
    >
      <div
        className="px-5 pt-[30px] pb-6 md:px-8"
        style={{
          background: '#fef2f2',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        <Image
          src="/analytir/logo-light.svg"
          alt="Analytir"
          width={100}
          height={25}
          unoptimized
          style={{ marginBottom: 18, width: 100, height: 'auto', display: 'block' }}
        />
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#0a0a0a',
            marginBottom: 8,
          }}
        >
          Business Alert
        </div>
        <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.5, margin: 0 }}>
          One metric has crossed a review threshold. Details below.
        </p>
      </div>

      <div className="px-5 pt-6 md:px-8">
        <div
          style={{
            background: '#fef2f2',
            borderLeft: '3px solid #dc2626',
            borderRadius: 6,
            padding: '20px 22px',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#0a0a0a',
              marginBottom: 8,
            }}
          >
            No transactions for 48 hours
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#3f3f46', margin: 0 }}>
            Your last transaction was 48 hours ago. This is unusual for your business.
          </p>

          <div
            style={{
              marginTop: 18,
              background: '#fde8e8',
              borderRadius: 6,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#991b1b',
                marginBottom: 10,
              }}
            >
              Suggested next steps:
            </div>
            <ol
              style={{
                fontSize: 13.5,
                lineHeight: 1.7,
                color: '#3f3f46',
                listStyleType: 'decimal',
                listStylePosition: 'outside',
                paddingLeft: 20,
                margin: 0,
              }}
            >
              {NEXT_STEPS.map((step, index) => (
                <li
                  key={step}
                  className={index >= 2 ? 'hidden md:list-item' : undefined}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 md:px-8">
        <div
          style={{
            background: '#f9f9fa',
            borderRadius: 6,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#0a0a0a',
              marginBottom: 10,
            }}
          >
            Historical Context
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: '#18181b',
              marginBottom: 10,
            }}
          >
            This is your worst week in the last 3 months.
          </div>
          {CONTEXT_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex justify-between"
              style={{ fontSize: 13.5, padding: '5px 0' }}
            >
              <span style={{ color: '#71717a' }}>{row.label}</span>
              <span style={{ ...mono, color: '#18181b' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-6 pb-[26px] md:px-8 md:pb-0">
        <span
          style={{
            display: 'inline-block',
            background: '#0a0a0a',
            color: '#ffffff',
            borderRadius: 6,
            padding: '13px 22px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          View Your Report →
        </span>
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            fontSize: 12,
            color: '#a1a1aa',
            lineHeight: 1.5,
          }}
        >
          This secure link expires in 7 days. Keep it private and don&apos;t share with
          others.
        </p>
      </div>

      <div
        className="hidden md:block"
        style={{
          marginTop: 26,
          borderTop: '1px solid #e5e5e5',
          padding: '20px 32px 26px',
        }}
      >
        <p style={{ fontSize: 15, color: '#3f3f46', margin: 0 }}>
          Your business, watched 24/7. So you don&apos;t have to.
        </p>
      </div>
    </div>
  )
}
