'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eyebrow } from '@/components/ui/Eyebrow'

const project = {
  name: 'Projext NeXt',
  description: 'A faith-based automotive trade school in Las Vegas. Launching soon.',
  image: '/work/projext-next.jpg',
}

const InProgress = () => {
  return (
    <section
      className="pt-16 md:pt-20 pb-0 short-landscape:pt-8 transition-colors duration-500"
      style={{ background: 'var(--background)' }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-7xl mx-auto"
        >
          <div className="mb-3 flex justify-center">
            <Eyebrow>Currently building</Eyebrow>
          </div>

          <div className="max-w-4xl mx-auto">
            <div
              className="relative mb-5 overflow-hidden rounded-xl aspect-[21/9]"
              style={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}
            >
              <Image
                src={project.image}
                alt={project.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>

            <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
              {project.name}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default InProgress
