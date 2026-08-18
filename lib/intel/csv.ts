const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/

/** Neutralize cells Excel/Sheets would execute as formulas. */
export function neutralizeCsvFormula(value: string): string {
  return FORMULA_PREFIX_RE.test(value) ? `'${value}` : value
}

export function csvTextField(value: string | null): string {
  if (value === null) {
    return ''
  }
  return neutralizeCsvFormula(value)
}

export function csvRawField(value: string | null): string {
  return value === null ? '' : value
}

export function encodeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export function encodeCsv(rows: readonly (readonly string[])[]): string {
  return `${rows.map((row) => row.map(encodeCsvField).join(',')).join('\r\n')}\r\n`
}
