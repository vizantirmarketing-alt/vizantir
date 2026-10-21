export const EM_DASH = '—'
export const EN_DASH = '–'

export function isSpace(char: string | undefined): boolean {
  return char !== undefined && /\p{Zs}/u.test(char)
}

export function isDashHit(text: string, index: number): boolean {
  const char = text[index]
  if (char === EM_DASH) return true
  if (char !== EN_DASH) return false
  return isSpace(text[index - 1]) && isSpace(text[index + 1])
}

export function hasDashHit(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (isDashHit(text, i)) return true
  }
  return false
}
