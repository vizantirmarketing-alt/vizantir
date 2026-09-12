import Link from 'next/link'

type ArticleCtaProps = {
  href: string
  label: string
}

export function ArticleCta({ href, label }: ArticleCtaProps) {
  return (
    <aside
      className="mt-12 p-6 rounded-2xl border"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
        Related service:{' '}
        <Link
          href={href}
          className="link-cobalt font-medium"
          style={{ color: 'var(--cobalt-accent)' }}
        >
          {label}
        </Link>
      </p>
    </aside>
  )
}