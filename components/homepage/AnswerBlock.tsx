import { Section } from '@/components/ui/Section'
interface AnswerBlockProps {
  body: string
}

export function AnswerBlock({ body }: AnswerBlockProps) {
  return (
    <Section edge="none" className="transition-colors duration-500 md:py-[var(--section-y)]"
      style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-gutter">
        <p className="sr-only md:not-sr-only mx-auto max-w-[55ch] text-base md:text-lg leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </Section>
  )
}
