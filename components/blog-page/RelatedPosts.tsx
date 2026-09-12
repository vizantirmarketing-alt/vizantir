import Link from 'next/link'

import type { RelatedPost } from '@/lib/blog-related'

type RelatedPostsProps = {
  posts: RelatedPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length < 1) return null

  return (
    <section className="mt-16">
      <h2
        className="text-2xl md:text-3xl font-bold mb-6"
        style={{ color: 'var(--foreground)' }}
      >
        Related articles
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <div
              className="card-interactive group h-full p-6 rounded-2xl border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'rgba(0,0,0,0.08)',
              }}
            >
              <h3
                className="text-xl font-bold leading-snug transition-colors duration-500 group-hover:opacity-80"
                style={{ color: 'var(--foreground)' }}
              >
                {post.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}