interface AnswerBlockProps {
  body: string
}

export function AnswerBlock({ body }: AnswerBlockProps) {
  return (
    <section
      className="py-16 md:py-20 short-landscape:py-8 transition-colors duration-500"
      style={{ background: 'var(--background)' }}
    >
      <div className="container mx-auto px-4">
        <p className="mx-auto max-w-3xl text-base md:text-lg leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </section>
  )
}
