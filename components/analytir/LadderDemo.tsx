'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

import {
  DAILY_COLLECTED,
  FEE_RATE,
  SERIES_END,
  TIP_RATE,
} from '@/data/analytir'

function formatMoney(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateRange(days: number): string {
  const start = new Date(SERIES_END)
  start.setDate(start.getDate() - (days - 1))

  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const endLabel = SERIES_END.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${startLabel} – ${endLabel}`
}

const monoStyle = {
  fontFamily: 'var(--font-analytir-mono)',
  fontVariantNumeric: 'tabular-nums' as const,
}

export function LadderDemo() {
  const [days, setDays] = useState(90)

  const slice = DAILY_COLLECTED.slice(90 - days)
  const collected = slice.reduce((sum, value) => sum + value, 0)
  const tips = collected * TIP_RATE
  const fees = collected * FEE_RATE
  const net = collected - tips - fees

  const lastDay = slice[slice.length - 1] ?? 0
  const transit = lastDay * (1 - TIP_RATE - FEE_RATE)
  const settled = net - transit
  const settledBasis = net > 0 ? (settled / net) * 100 : 0
  const transitBasis = net > 0 ? (transit / net) * 100 : 0

  const tipPct = (TIP_RATE * 100).toFixed(1)
  const feePct = (FEE_RATE * 100).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="rounded-2xl bg-white p-6 md:p-8"
      style={{
        fontFamily: 'var(--font-analytir-sans)',
        border: '1px solid var(--card-glass-border)',
        boxShadow: 'var(--card-glass-shadow)',
      }}
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <span
          className="text-[11px] uppercase tracking-[0.16em]"
          style={{ ...monoStyle, color: '#a1a1aa' }}
        >
          CASH FLOW
        </span>
        <span className="text-xs" style={{ ...monoStyle, color: '#71717a' }}>
          {formatDateRange(days)}
        </span>
      </div>

      <input
        type="range"
        min={7}
        max={90}
        step={1}
        value={days}
        aria-label="Date range in days"
        onChange={(event) => setDays(Number(event.target.value))}
        className="ladder-demo-range w-full cursor-pointer appearance-none bg-transparent"
      />
      <div className="mt-2 flex justify-between text-[11px]" style={{ color: '#a1a1aa' }}>
        <span>7 days</span>
        <span>90 days</span>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between py-3">
          <span className="font-semibold" style={{ color: '#0a0a0a' }}>
            Total collected
          </span>
          <span style={{ ...monoStyle, color: '#0a0a0a' }}>{formatMoney(collected)}</span>
        </div>

        <div
          className="flex items-baseline justify-between py-3"
          style={{ borderTop: '1px solid #e8e8ea' }}
        >
          <span style={{ color: '#0a0a0a' }}>Tips</span>
          <span style={monoStyle}>
            <span style={{ color: '#b91c1c' }}>-{formatMoney(tips)}</span>
            <span style={{ color: '#a1a1aa' }}>{` · ${tipPct}%`}</span>
          </span>
        </div>

        <div
          className="flex items-baseline justify-between py-3"
          style={{ borderTop: '1px solid #e8e8ea' }}
        >
          <span style={{ color: '#0a0a0a' }}>Processing fees</span>
          <span style={monoStyle}>
            <span style={{ color: '#b91c1c' }}>-{formatMoney(fees)}</span>
            <span style={{ color: '#a1a1aa' }}>{` · ${feePct}%`}</span>
          </span>
        </div>

        <div
          className="flex items-baseline justify-between py-3"
          style={{ borderTop: '1.5px solid #0a0a0a' }}
        >
          <span className="font-bold" style={{ color: '#0a0a0a' }}>
            Net after deductions
          </span>
          <span className="font-bold" style={{ ...monoStyle, color: '#0a0a0a' }}>
            {formatMoney(net)}
          </span>
        </div>
      </div>

      <div className="mt-5 pt-5" style={{ borderTop: '1px solid #e8e8ea' }}>
        <div className="flex h-2 overflow-hidden rounded" style={{ height: 8 }}>
          <span
            className="ladder-demo-settlement-seg"
            style={{
              background: '#8b5cf6',
              flexBasis: `${settledBasis}%`,
              flexGrow: 0,
              flexShrink: 0,
            }}
          />
          <span
            className="ladder-demo-settlement-seg"
            style={{
              background: '#ddd6fe',
              flexBasis: `${transitBasis}%`,
              flexGrow: 0,
              flexShrink: 0,
            }}
          />
        </div>

        <div className="mt-3 flex justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block shrink-0 rounded"
              style={{ width: 9, height: 9, background: '#8b5cf6' }}
            />
            <span style={{ color: '#0a0a0a' }}>In your bank</span>
            <span style={{ ...monoStyle, color: '#0a0a0a' }}>{formatMoney(settled)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block shrink-0 rounded"
              style={{ width: 9, height: 9, background: '#ddd6fe' }}
            />
            <span style={{ color: '#0a0a0a' }}>Still in transit</span>
            <span style={{ ...monoStyle, color: '#0a0a0a' }}>{formatMoney(transit)}</span>
          </div>
        </div>

        <p className="mt-4 text-xs" style={{ color: '#71717a' }}>
          Payouts settle the day after the sale, so the most recent day never appears in the bank
          balance. That gap is timing, not loss.
        </p>
      </div>

      <style jsx>{`
        .ladder-demo-range {
          height: 18px;
        }

        .ladder-demo-range::-webkit-slider-runnable-track {
          height: 3px;
          background: #e8e8ea;
          border-radius: 999px;
        }

        .ladder-demo-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          margin-top: -7.5px;
          border-radius: 999px;
          background: #8b5cf6;
          box-shadow: 0 0 0 3px #fff;
          cursor: pointer;
        }

        .ladder-demo-range::-moz-range-track {
          height: 3px;
          background: #e8e8ea;
          border-radius: 999px;
        }

        .ladder-demo-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 999px;
          background: #8b5cf6;
          box-shadow: 0 0 0 3px #fff;
          cursor: pointer;
        }

        .ladder-demo-settlement-seg {
          display: block;
          height: 100%;
        }

        @media (prefers-reduced-motion: no-preference) {
          .ladder-demo-settlement-seg {
            transition: flex-basis 260ms cubic-bezier(0.2, 0.7, 0.3, 1);
          }
        }
      `}</style>
    </motion.div>
  )
}
