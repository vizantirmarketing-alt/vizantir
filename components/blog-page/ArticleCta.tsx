import { Card } from '@/components/ui/Card'
import Link from 'next/link'

type ArticleCtaProps = {
  href: string
  label: string
}

export function ArticleCta({ href, label }: ArticleCtaProps) {
  return (
    <Card as="aside" variant="plain" pad="sm" badge={false}
      className="mt-12 block h-auto rounded-2xl border"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <p className="text-base md:text-sm leading-normal md:leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        Related service:{' '}
        <Link
          href={href}
          className="link-ui font-medium"
          style={{ color: 'var(--cobalt-text)' }}
        >
          {label}
        </Link>
      </p>
    </Card>
  )
}