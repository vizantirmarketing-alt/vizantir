function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function shouldShowCaseStudyClient(title: string, client?: string | null): boolean {
  if (!client?.trim()) return false
  return normalizeLabel(client) !== normalizeLabel(title)
}

export function formatCaseStudyMetadataLine(
  title: string,
  client?: string | null,
  industry?: string | null,
): string | null {
  const parts: string[] = []

  if (shouldShowCaseStudyClient(title, client)) {
    parts.push(client!.trim())
  }

  if (industry?.trim()) {
    parts.push(industry.trim())
  }

  return parts.length > 0 ? parts.join(' • ') : null
}
