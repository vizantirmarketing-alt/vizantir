/**
 * Rasterize Vizantir Arcade PWA icons.
 * Uses sharp (already present via Next.js). No new dependencies.
 *
 *   node scripts/generate-arcade-icons.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public/play/icons')

const BG = '#090B1A'
const CREAM = { r: 232, g: 221, b: 199 }
const CYAN = { r: 34, g: 240, b: 255 }

/**
 * Geometric Satoshi-Black-like A in a 100×100 em box, evenodd.
 * Heavy stems, pointed apex, crossbar just below optical center.
 */
const LETTER_A = `
  M 50 6
  L 94 91
  L 75 91
  L 68.2 73.4
  L 31.8 73.4
  L 25 91
  L 6 91
  Z
  M 50 28.5
  L 61.6 61.5
  L 38.4 61.5
  Z
`.replace(/\s+/g, ' ').trim()

function letterSvg(size, inset) {
  const box = size - inset * 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${inset} ${inset}) scale(${box / 100})">
    <path fill="#ffffff" fill-rule="evenodd" d="${LETTER_A}"/>
  </g>
</svg>`
}

async function composeIcon(size, inset, glowSigma) {
  const letter = await sharp(Buffer.from(letterSvg(size, inset)))
    .resize(size, size)
    .ensureAlpha()
    .png()
    .toBuffer()

  const cream = await sharp(letter)
    .tint(CREAM)
    .png()
    .toBuffer()

  const glow = await sharp(letter)
    .tint(CYAN)
    .blur(glowSigma)
    .modulate({ brightness: 1.35, saturation: 1.8 })
    .png()
    .toBuffer()

  const innerGlow = await sharp(letter)
    .tint(CYAN)
    .blur(Math.max(2, Math.round(glowSigma * 0.4)))
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BG,
    },
  })
    .composite([
      { input: glow, blend: 'screen' },
      { input: glow, blend: 'screen' },
      { input: innerGlow, blend: 'screen' },
      { input: cream, blend: 'over' },
    ])
    .png()
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const masterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(72 72) scale(3.68)">
    <path fill="#E8DDC7" fill-rule="evenodd" filter="url(#glow)" d="${LETTER_A}"/>
  </g>
  <defs>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur"/>
      <feFlood flood-color="#22F0FF" flood-opacity="0.9" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>`

  await writeFile(join(OUT_DIR, 'icon.svg'), masterSvg)

  await (await composeIcon(192, 28, 7)).toFile(join(OUT_DIR, 'icon-192.png'))
  await (await composeIcon(512, 74, 18)).toFile(join(OUT_DIR, 'icon-512.png'))
  await (await composeIcon(512, 112, 16)).toFile(join(OUT_DIR, 'icon-512-maskable.png'))
  await (await composeIcon(180, 26, 6)).toFile(join(OUT_DIR, 'apple-touch-icon.png'))

  console.log(`Wrote arcade icons to ${OUT_DIR}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
