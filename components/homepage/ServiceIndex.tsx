import { Section } from '@/components/ui/Section'
import Link from 'next/link'

import type { LinkedService } from '@/lib/linked-services'

type ServiceIndexProps = {
  services: LinkedService[]
}

export function ServiceIndex({ services }: ServiceIndexProps) {
  if (services.length === 0) return null

  return (
    <Section className="px-6 transition-colors duration-500 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <h2
          id="services-heading"
          className="text-balance font-black tracking-tight text-foreground md:text-4xl"
        >
          Services
        </h2>

        <div className="mt-10">
          {services.map((service) => (
            <div
              key={service.href}
              className="grid gap-2 border-t border-border py-[var(--list-item-y)] md:grid-cols-3 md:gap-12"
            >
              <h3 className="text-balance text-[22px] leading-[1.2] md:text-xl md:leading-7 font-bold text-foreground">
                <Link href={service.href} className="link-ui">
                  {service.title}
                </Link>
              </h3>
              {service.description ? (
                <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground md:col-span-2">
                  {service.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
