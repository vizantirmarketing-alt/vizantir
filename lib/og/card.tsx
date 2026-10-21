import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

// Brand tokens from app/globals.css, converted from oklch to sRGB hex because
// next/og cannot parse oklch(): --background, --foreground, --text-meta, --cobalt-text.
const BACKGROUND = '#FAF9F5'
const FOREGROUND = '#171614'
const META = '#646360'
const CATEGORY = '#0068E3'

const PADDING = 72
const MAX_LINES = 3
const TITLE_SIZES = [88, 80, 72, 64, 56, 50, 44, 40]
// Satoshi Bold averages roughly 0.54em per character; padded so wrapping errs toward a smaller size.
const AVG_CHAR_EM = 0.56

// Satori cannot read the woff2 files the site loads, so these are TTF conversions of the same Satoshi cuts.
let fontsPromise: Promise<{ bold: Buffer; medium: Buffer }> | null = null

function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), 'lib/og-fonts/Satoshi-Bold.ttf')),
    readFile(join(process.cwd(), 'lib/og-fonts/Satoshi-Medium.ttf')),
  ]).then(([bold, medium]) => ({ bold, medium }))
  return fontsPromise
}

let wordmarkPromise: Promise<string> | null = null

function loadWordmark() {
  wordmarkPromise ??= readFile(join(process.cwd(), 'public/logo/logo-light.svg')).then(
    (svg) => `data:image/svg+xml;base64,${svg.toString('base64')}`,
  )
  return wordmarkPromise
}

function lineCount(title: string, fontSize: number): number {
  const maxChars = Math.floor((OG_SIZE.width - PADDING * 2) / (fontSize * AVG_CHAR_EM))
  let lines = 1
  let current = 0
  for (const word of title.split(/\s+/)) {
    const next = current === 0 ? word.length : current + 1 + word.length
    if (next > maxChars && current > 0) {
      lines += 1
      current = word.length
    } else {
      current = next
    }
  }
  return lines
}

const MIN_SIZE = TITLE_SIZES[TITLE_SIZES.length - 1]

// Shrinks the font until the title fits in three lines; a title too long even at the
// smallest size is cut at a word boundary and ellipsized rather than wrapping to a fourth line.
function fitTitle(title: string): { text: string; fontSize: number } {
  const fontSize = TITLE_SIZES.find((size) => lineCount(title, size) <= MAX_LINES)
  if (fontSize) return { text: title, fontSize }

  const words = title.split(/\s+/)
  while (words.length > 1 && lineCount(`${words.join(' ')}\u2026`, MIN_SIZE) > MAX_LINES) words.pop()
  return { text: `${words.join(' ')}\u2026`, fontSize: MIN_SIZE }
}

export async function defaultOgImage(): Promise<Response> {
  const png = await readFile(join(process.cwd(), 'public/og-image.png'))
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': OG_CONTENT_TYPE } })
}

export async function renderOgCard({
  title,
  meta,
}: {
  title: string
  meta?: { category?: string; readTime?: string }
}): Promise<ImageResponse> {
  const [fonts, wordmark] = await Promise.all([loadFonts(), loadWordmark()])
  const { text, fontSize } = fitTitle(title)
  const category = meta?.category?.trim()
  const readTime = meta?.readTime?.trim()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: PADDING,
          background: BACKGROUND,
          color: FOREGROUND,
          fontFamily: 'Satoshi',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {category || readTime ? (
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 500, marginBottom: 28 }}>
              {category ? <span style={{ color: CATEGORY }}>{category}</span> : null}
              {category && readTime ? <span style={{ color: META, margin: '0 14px' }}>•</span> : null}
              {readTime ? <span style={{ color: META }}>{readTime}</span> : null}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            {text}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={wordmark} width={233} height={28} />
          <div style={{ fontSize: 28, fontWeight: 500, color: META }}>vizantir.com</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Satoshi', data: fonts.medium, weight: 500, style: 'normal' },
        { name: 'Satoshi', data: fonts.bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
