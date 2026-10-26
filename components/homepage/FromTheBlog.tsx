import { Section } from '@/components/ui/Section'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export type HomepageBlogPost = {
  title: string
  slug: string
  publishedAt: string
  category?: string
}

const POST_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: 'America/Los_Angeles',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}

function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', POST_DATE_FORMAT)
}

type FromTheBlogProps = {
  posts: HomepageBlogPost[]
}

export function FromTheBlog({ posts }: FromTheBlogProps) {
  if (posts.length === 0) return null

  return (
    <Section size="sm" className="px-6 transition-colors duration-500 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-balance font-black tracking-tight text-foreground md:text-4xl">
          From the blog
        </h2>

        <div className="mt-10">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-t border-border py-[var(--list-item-y)]"
            >
              <h3 className="text-balance text-xl leading-tight md:leading-7 font-bold text-foreground">
                <Link href={`/blog/${post.slug}`} className="link-ui">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.category ? (
                  <>
                    <span>{post.category}</span>
                    <span aria-hidden="true"> · </span>
                  </>
                ) : null}
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              </p>
            </article>
          ))}
        </div>

        <Link
          href="/blog"
          className="group mt-6 inline-flex items-center gap-2 font-semibold text-cobalt-text transition-opacity duration-300 hover:opacity-85"
        >
          <span>All articles</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  )
}
