import { projectProvenance } from '@/data/pricing'
import { cn } from '@/lib/utils'

export function ProjectProvenance({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-[48ch] space-y-4 text-pretty text-base leading-relaxed text-foreground', className)}>
      {projectProvenance.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}
