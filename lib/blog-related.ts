export type RelatedPost = {
  title: string
  slug: string
}

export type RelatedPostsQueryResult = {
  sameCategory: RelatedPost[]
  recent: RelatedPost[]
}

/** Same-category posts first, then most-recent others, always up to three. */
export function pickRelatedPosts(result: RelatedPostsQueryResult | null): RelatedPost[] {
  if (!result) return []

  const selected: RelatedPost[] = []
  const seen = new Set<string>()

  for (const post of [...result.sameCategory, ...result.recent]) {
    if (selected.length >= 3) break
    if (!post.slug || seen.has(post.slug)) continue
    seen.add(post.slug)
    selected.push(post)
  }

  return selected
}