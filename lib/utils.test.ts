// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/utils.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { twMerge } from 'tailwind-merge'

import { cn } from './utils'

describe('cn', () => {
  it('lets an Intel type utility replace a text-* size, so Intel buttons get the Intel size', () => {
    assert.equal(cn('inline-flex rounded-md text-sm font-medium', 'bg-cobalt-primary intel-secondary text-white'), 'inline-flex rounded-md font-medium bg-cobalt-primary intel-secondary text-white')
    assert.equal(cn('intel-body', 'intel-secondary'), 'intel-secondary')
    assert.equal(cn('intel-body text-body', 'text-meta'), 'intel-body text-meta')
  })

  it('merges every class without an intel- prefix exactly as plain tailwind-merge does (the public site is unchanged)', () => {
    for (const [a, b] of [
      ['text-sm font-medium', 'text-lg'],
      ['px-2 py-1 text-base', 'text-xl md:text-2xl'],
      ['bg-primary text-primary-foreground hover:bg-primary/90', 'bg-cobalt-gradient text-white'],
      ['inline-flex h-9 px-4 py-2 text-sm disabled:opacity-50', 'h-12 px-8 text-base'],
      ['text-[0.95rem] leading-[1.65] text-body', 'text-meta'],
    ]) {
      assert.equal(cn(a, b), twMerge(a, b), `${a} + ${b}`)
    }
  })
})
