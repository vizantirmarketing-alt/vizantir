import type { AboutIntroContent } from '@/data/about'

interface AboutIntroExamplesProps {
  content: AboutIntroContent
}

export default function AboutIntroExamples({ content }: AboutIntroExamplesProps) {
  return (
    <section className="px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          {content.examples.map((example) => (
            <p key={example} className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {example}
            </p>
          ))}
        </div>

        <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">{content.closing}</p>
      </div>
    </section>
  )
}
