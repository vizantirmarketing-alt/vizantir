import { Section } from '@/components/ui/Section'
interface AnswerBlockProps {
  body: string
}

export function AnswerBlock({ body }: AnswerBlockProps) {
  return (
    <Section edge="none" className="px-6 transition-colors duration-500 md:px-12 md:py-[var(--section-y)] lg:px-20"
      style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-5xl">
        <p className="sr-only md:not-sr-only max-w-[55ch] text-base md:text-lg leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </Section>
  )
}
